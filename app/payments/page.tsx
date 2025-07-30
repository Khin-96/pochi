"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { sendMoney, fetchTransactions, getCurrentUser, verifyRecipient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DownloadIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { sendMoneySchema } from "@/lib/validation";

type Transaction = {
  id: string;
  amount: number;
  description: string;
  recipient: string;
  date: string;
  type: "credit" | "debit";
};

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  balance: number;
};

const formatCurrency = (value: number, currency: string = 'KES') => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof sendMoneySchema>>({
    resolver: zodResolver(sendMoneySchema),
    defaultValues: {
      recipientType: "phone",
      recipientPhone: "",
      recipientEmail: "",
      amount: "",
      description: "",
      recipientName: "",
    },
  });

  const recipientType = form.watch("recipientType");
  const amount = form.watch("amount");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, transactionsData] = await Promise.all([
          getCurrentUser(),
          fetchTransactions()
        ]);
        
        if (userData && userData.balance) {
          userData.balance = Number(userData.balance);
        }

        setUser(userData);
        setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleVerifyRecipient = async (values: z.infer<typeof sendMoneySchema>) => {
    if (!user) return;
    
    // Check balance first
    if (user.balance < Number(values.amount)) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough funds for this transaction.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);
    
    try {
      const identifier = values.recipientType === "phone" 
        ? values.recipientPhone 
        : values.recipientEmail;
      
      if (!identifier) {
        toast({
          title: "Error",
          description: "Please provide recipient details",
          variant: "destructive",
        });
        return;
      }

      const verification = await verifyRecipient(
        identifier,
        values.recipientType
      );

      if (!verification.verified) {
        throw new Error(verification.message || "Recipient verification failed");
      }

      // Store recipient name for confirmation
      form.setValue('recipientName', verification.name);
      
      // Show confirmation dialog
      setShowConfirmation(true);
      
    } catch (error) {
      console.error("Verification failed:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Recipient not found. Please check the details and try again.";
      
      setVerificationError(errorMessage);
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmSend = async () => {
    if (!user) return;
    
    const values = form.getValues();
    const identifier = values.recipientType === "phone" 
      ? values.recipientPhone 
      : values.recipientEmail;
    
    if (!identifier) return;

    setIsSending(true);

    try {
      const response = await sendMoney(
        identifier,
        Number(values.amount),
        values.description || "",
        values.recipientType
      );

      toast({
        title: "Success",
        description: `${formatCurrency(Number(values.amount))} sent successfully to ${values.recipientName || "recipient"}!`,
      });

      // Refresh data
      const [updatedUser, updatedTransactions] = await Promise.all([
        getCurrentUser(),
        fetchTransactions()
      ]);

      if (updatedUser && updatedUser.balance) {
        updatedUser.balance = Number(updatedUser.balance);
      }

      setUser(updatedUser);
      setTransactions(Array.isArray(updatedTransactions) ? updatedTransactions : []);
      form.reset();
    } catch (error: any) {
      console.error("Failed to send money:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send money. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
      setShowConfirmation(false);
    }
  };

  const handleCancelSend = () => {
    setShowConfirmation(false);
    toast({
      title: "Cancelled",
      description: "Transaction was cancelled.",
    });
  };

  const downloadReceipt = (transaction: Transaction) => {
    toast({
      title: "Receipt Download",
      description: `Receipt for transaction ${transaction.id} would be downloaded.`,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payments</h1>
        {user ? (
          <div className="text-right">
            <p className="text-sm text-gray-500">Available Balance</p>
            <p className="text-2xl font-semibold">{formatCurrency(user.balance)}</p>
          </div>
        ) : (
          <Skeleton className="h-12 w-48" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Send Money Form */}
        <Card>
          <CardHeader>
            <CardTitle>Send Money</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form 
                onSubmit={form.handleSubmit(handleVerifyRecipient)} 
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="recipientType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Recipient Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="phone" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Phone Number
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="email" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Email
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {recipientType === "phone" ? (
                  <FormField
                    control={form.control}
                    name="recipientPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="0712345678" 
                            {...field} 
                            autoComplete="on"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="recipientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="recipient@example.com" 
                            {...field} 
                            autoComplete="off"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (KES)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="500"
                          min="10"
                          step="1"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      {user && (
                        <p className="text-sm text-gray-500">
                          Available balance: {formatCurrency(user.balance)}
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="e.g. For groceries" 
                          {...field} 
                          maxLength={100} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {verificationError && (
                  <div className="text-red-600 text-sm">
                    {verificationError}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || isVerifying || !user}
                >
                  {isVerifying ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </>
                  ) : "Verify Recipient"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No transactions yet</p>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {transaction.type === 'credit' ? 'Received from' : 'Sent to'} {transaction.recipient}
                      </p>
                      <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                      {transaction.description && (
                        <p className="text-sm mt-1">{transaction.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => downloadReceipt(transaction)}
                      >
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        Receipt
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Transaction</DialogTitle>
            <DialogDescription>
              Please confirm the transaction details below:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Transaction Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Recipient:</span>
                  <div className="flex items-center">
                    <span className="font-medium">
                      {form.getValues('recipientName') || 'Unknown'}
                    </span>
                    <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Verified
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="font-medium">{formatCurrency(Number(amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Recipient Type:</span>
                  <span className="font-medium capitalize">{recipientType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Recipient:</span>
                  <span className="font-medium">
                    {recipientType === 'phone' 
                      ? form.getValues('recipientPhone')
                      : form.getValues('recipientEmail')}
                  </span>
                </div>
                {form.getValues('description') && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Description:</span>
                    <span className="font-medium">{form.getValues('description')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="font-medium text-yellow-800 mb-1">Important</h3>
              <p className="text-sm text-yellow-700">
                Please double-check all details before confirming. Transactions cannot be reversed once completed.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCancelSend}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmSend}
              disabled={isSending}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : "Confirm & Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}