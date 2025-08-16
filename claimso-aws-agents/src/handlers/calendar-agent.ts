import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getActiveUsers, getProductsByUserId, updateProduct, type AgentType } from '../shared/database';
import { logAgentActivity } from '../shared/utils';

const AGENT_TYPE: AgentType = 'calendar';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  type: 'warranty_expiry' | 'maintenance_reminder' | 'claim_deadline' | 'service_appointment';
  productId: string;
  productName: string;
  userId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRecurring: boolean;
  recurrenceRule?: string;
}

interface ExternalCalendarConfig {
  type: 'google' | 'outlook' | 'apple' | 'ical';
  accessToken?: string;
  refreshToken?: string;
  calendarId?: string;
  isEnabled: boolean;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const agentName = 'CalendarAgent';
  
  try {
    logAgentActivity(agentName, 'Starting daily calendar event generation', { 
      timestamp: new Date().toISOString(),
      eventSource: event.requestContext?.stage || 'unknown'
    });

    // Get all active users first
    const activeUsers = await getActiveUsers(AGENT_TYPE);
    
    if (!activeUsers || activeUsers.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No active users found' })
      };
    }

    let totalEventsGenerated = 0;
    let totalWarrantyEvents = 0;
    let totalMaintenanceEvents = 0;
    let totalExternalSyncs = 0;

    // Process each user's products
    for (const user of activeUsers) {
      try {
        const products = await getProductsByUserId(AGENT_TYPE, user.id);
        
        logAgentActivity(agentName, 'Processing user products for calendar events', { 
          userId: user.id, 
          count: products?.length || 0 
        });

        for (const product of products || []) {
          try {
            const events = await generateProductCalendarEvents(product);
            
            if (events.length > 0) {
              totalEventsGenerated += events.length;
              
              // Count event types
              events.forEach(event => {
                if (event.type === 'warranty_expiry') totalWarrantyEvents++;
                if (event.type === 'maintenance_reminder') totalMaintenanceEvents++;
              });
              
              // Store events in database
              for (const calendarEvent of events) {
                await storeCalendarEvent(calendarEvent);
              }

              // Sync with external calendars if configured
              const externalSyncs = await syncWithExternalCalendars(user.id, events);
              totalExternalSyncs += externalSyncs;

              logAgentActivity(agentName, 'Generated calendar events for product', {
                productId: product.id,
                productName: product.product_name,
                eventsCount: events.length,
                externalSyncs
              });
            }

          } catch (error) {
            logAgentActivity(agentName, 'Error generating calendar events for product', {
              productId: product.id,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      } catch (error) {
        logAgentActivity(agentName, 'Error processing user products for calendar', {
          userId: user.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logAgentActivity(agentName, 'Completed calendar event generation', {
      usersProcessed: activeUsers.length,
      totalEventsGenerated,
      totalWarrantyEvents,
      totalMaintenanceEvents,
      totalExternalSyncs
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Calendar event generation completed',
        usersProcessed: activeUsers.length,
        totalEventsGenerated,
        totalWarrantyEvents,
        totalMaintenanceEvents,
        totalExternalSyncs
      })
    };

  } catch (error) {
    logAgentActivity(agentName, 'Fatal error in calendar agent', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};

async function generateProductCalendarEvents(product: any): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];
  const now = new Date();
  
  // Generate warranty expiry events
  if (product.warranties && product.warranties.length > 0) {
    for (const warranty of product.warranties) {
      if (warranty.warranty_end_date) {
        const expiryDate = new Date(warranty.warranty_end_date);
        
        // Only create events for future dates
        if (expiryDate > now) {
          // Main expiry event
          events.push({
            id: `warranty-expiry-${product.id}-${warranty.id}`,
            title: `${product.product_name} Warranty Expires`,
            description: `Your warranty for ${product.product_name} expires today. Consider filing a claim if you have any issues.`,
            startDate: expiryDate.toISOString(),
            endDate: new Date(expiryDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
            type: 'warranty_expiry',
            productId: product.id,
            productName: product.product_name,
            userId: product.user_id,
            priority: 'high',
            isRecurring: false
          });
          
          // 30-day reminder
          const reminderDate = new Date(expiryDate);
          reminderDate.setDate(reminderDate.getDate() - 30);
          
          if (reminderDate > now) {
            events.push({
              id: `warranty-reminder-${product.id}-${warranty.id}`,
              title: `${product.product_name} Warranty Expires Soon`,
              description: `Your warranty for ${product.product_name} expires in 30 days. Consider filing a claim if you have any issues.`,
              startDate: reminderDate.toISOString(),
              endDate: new Date(reminderDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
              type: 'warranty_expiry',
              productId: product.id,
              productName: product.product_name,
              userId: product.user_id,
              priority: 'medium',
              isRecurring: false
            });
          }
        }
      }
    }
  }
  
  // Generate maintenance reminder events
  const maintenanceDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
  events.push({
    id: `maintenance-${product.id}-${Date.now()}`,
    title: `${product.product_name} Maintenance Check`,
    description: `Schedule a maintenance check for ${product.product_name}. Regular maintenance helps extend product life and maintain warranty coverage.`,
    startDate: maintenanceDate.toISOString(),
    endDate: new Date(maintenanceDate.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hour event
    type: 'maintenance_reminder',
    productId: product.id,
    productName: product.product_name,
    userId: product.user_id,
    priority: 'medium',
    isRecurring: true,
    recurrenceRule: 'FREQ=MONTHLY;INTERVAL=6' // Every 6 months
  });
  
  return events;
}

async function storeCalendarEvent(event: CalendarEvent): Promise<void> {
  // This would store the event in the database
  // For now, we'll log it
  logAgentActivity('CalendarAgent', 'Calendar event created', {
    eventId: event.id,
    eventType: event.type,
    productId: event.productId,
    startDate: event.startDate
  });
}

async function syncWithExternalCalendars(userId: string, events: CalendarEvent[]): Promise<number> {
  let syncCount = 0;
  
  // Get user's external calendar configurations
  const externalCalendars = await getUserExternalCalendars(userId);
  
  for (const calendar of externalCalendars) {
    if (calendar.isEnabled) {
      try {
        switch (calendar.type) {
          case 'google':
            await syncWithGoogleCalendar(calendar, events);
            syncCount++;
            break;
          case 'outlook':
            await syncWithOutlookCalendar(calendar, events);
            syncCount++;
            break;
          case 'apple':
            await syncWithAppleCalendar(calendar, events);
            syncCount++;
            break;
          case 'ical':
            // iCal files are generated on-demand, not synced
            break;
        }
      } catch (error) {
        logAgentActivity('CalendarAgent', 'External calendar sync failed', {
          userId,
          calendarType: calendar.type,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }
  
  return syncCount;
}

async function getUserExternalCalendars(userId: string): Promise<ExternalCalendarConfig[]> {
  // This would fetch from the database
  // For now, return empty array
  return [];
}

async function syncWithGoogleCalendar(config: ExternalCalendarConfig, events: CalendarEvent[]): Promise<void> {
  // Google Calendar API integration
  logAgentActivity('CalendarAgent', 'Google Calendar sync initiated', {
    eventsCount: events.length
  });
}

async function syncWithOutlookCalendar(config: ExternalCalendarConfig, events: CalendarEvent[]): Promise<void> {
  // Outlook Calendar API integration
  logAgentActivity('CalendarAgent', 'Outlook Calendar sync initiated', {
    eventsCount: events.length
  });
}

async function syncWithAppleCalendar(config: ExternalCalendarConfig, events: CalendarEvent[]): Promise<void> {
  // Apple Calendar integration
  logAgentActivity('CalendarAgent', 'Apple Calendar sync initiated', {
    eventsCount: events.length
  });
}
