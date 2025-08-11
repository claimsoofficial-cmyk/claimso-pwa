'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, CheckCircle } from 'lucide-react';
import { updateProductDetails } from '@/lib/actions/product-actions';

// Form validation schema
const editProductSchema = z.object({
  serial_number: z.string().min(1, 'Serial number is required').max(50, 'Serial number too long'),
  order_number: z.string().min(1, 'Order number is required').max(50, 'Order number too long'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

type EditProductFormData = z.infer<typeof editProductSchema>;

interface Product {
  id: string;
  name: string;
  category: string;
  serial_number?: string;
  order_number?: string;
  notes?: string;
}

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSuccess?: () => void;
}

export default function EditProductModal({ 
  isOpen, 
  onClose, 
  product, 
  onSuccess 
}: EditProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditProductFormData>({
    resolver: zodResolver(editProductSchema),
    defaultValues: {
      serial_number: product.serial_number || '',
      order_number: product.order_number || '',
      notes: product.notes || '',
    },
  });

  const handleSubmit = async (data: EditProductFormData) => {
    setIsSubmitting(true);
    
    try {
      // Create FormData for Server Action
      const formData = new FormData();
      formData.append('productId', product.id);
      formData.append('serial_number', data.serial_number);
      formData.append('order_number', data.order_number);
      formData.append('notes', data.notes || '');

      // Call Server Action
      const result = await updateProductDetails(formData);
      
      if (result.success) {
        toast.success('Product Updated Successfully', {
          description: `${product.name} details have been updated and your claim readiness improved.`,
          icon: <CheckCircle className="h-4 w-4" />,
          duration: 4000,
        });
        
        // Close modal and notify parent
        onClose();
        onSuccess?.();
        
        // Reset form
        form.reset();
      } else {
        toast.error('Update Failed', {
          description: result.error || 'Failed to update product details. Please try again.',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Product update error:', error);
      toast.error('Unexpected Error', {
        description: 'An unexpected error occurred. Please try again.',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Improve Claim Readiness</DialogTitle>
          <DialogDescription>
            Add essential details for <strong>{product.name}</strong> to streamline future support requests and claims.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Serial Number Field */}
            <FormField
              control={form.control}
              name="serial_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial Number *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter product serial number"
                      disabled={isSubmitting}
                      className="font-mono text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Order Number Field */}
            <FormField
              control={form.control}
              name="order_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Number *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter order/invoice number"
                      disabled={isSubmitting}
                      className="font-mono text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes Field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Purchase location, warranty info, or other relevant details..."
                      disabled={isSubmitting}
                      rows={3}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Updating...' : 'Update Details'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}