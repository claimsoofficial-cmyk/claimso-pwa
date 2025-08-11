import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

/**
 * Custom hook for managing the product welcome tour
 * Uses driver.js to create an interactive guided tour experience
 */
export function useProductTour() {
  /**
   * Starts the interactive welcome tour
   * Configures driver.js with a series of steps to guide new users
   */
  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      steps: [
        {
          element: '#product-card-0',
          popover: {
            title: 'Welcome to Your Product Dashboard',
            description: 'This is your Living Card - it adapts and grows smarter as you add more information about your products. Each card shows everything you need to know at a glance.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#warranty-snapshot-0',
          popover: {
            title: 'AI-Powered Warranty Intelligence',
            description: 'Our AI has analyzed your warranty documents to give you a clear snapshot of what\'s covered and what\'s not. No more digging through dense legal text - we make it simple.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '#claim-readiness-0',
          popover: {
            title: 'Claim Readiness Score',
            description: 'This shows how prepared you are if something goes wrong. We\'ll guide you through completing any missing information to ensure smooth warranty claims when you need them.',
            side: 'left',
            align: 'start'
          }
        },
        {
          element: '#problem-button-0',
          popover: {
            title: 'Your Resolution Engine',
            description: 'When something goes wrong, this button activates our Resolution Engine. We\'ll walk you through the warranty claim process step-by-step, making sure you get the help you deserve.',
            side: 'top',
            align: 'center'
          }
        }
      ],
      onDeselected: () => {
        // Mark tour as completed when user exits early
        localStorage.setItem('hasCompletedTour', 'true');
      },
      onDestroyed: () => {
        // Mark tour as completed when tour finishes normally
        localStorage.setItem('hasCompletedTour', 'true');
      }
    });

    driverObj.drive();
  };

  return {
    startTour
  };
}