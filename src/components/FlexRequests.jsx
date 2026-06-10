import React, { useState, useEffect } from "react";
// Make sure to adjust these import paths to match your Admin Panel's folder structure
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KeyRound, Copy, Loader2, Clock, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { secureFetch } from "@/utils/api";

const FlexRequests = () => {
  // const { toast } = ();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Modal State for the generated code
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  // const getSecureHeaders = async () => {
  //   const {
  //     data: { session },
  //   } = await supabase.auth.getSession();
  //   return {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${session?.access_token}`,
  //   };
  // };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await secureFetch(
        `${import.meta.env.VITE_API_URL}/api/admin/subscriptions/flex-requests`
      );
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests);
      } else {
        throw new Error(data.error || "Failed to fetch requests");
      }
    } catch (err) {
      toast.error(`Error fetching requests: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (requestId, subscriptionId, email) => {
    setProcessingId(requestId);
    try {
      const res = await secureFetch(
        `${import.meta.env.VITE_API_URL}/api/admin/subscriptions/flex-requests/fulfill`,
        {
          method: "POST",
          body: JSON.stringify({ requestId, subscriptionId }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setGeneratedCode(data.code);
        setCustomerEmail(email);
        setShowCodeModal(true);
        // Remove the fulfilled request from the table instantly
        setRequests((prev) => prev.filter((r) => r.request_id !== requestId));
       toast.success("Unlock code generated successfully.");
      } else {
        throw new Error(data.error || "Failed to generate code");
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    toast.success("Code copied to clipboard.");
  };

  return (
    <>
      <div className="container max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Flex Channel Requests</h1>
            <p className="text-muted-foreground mt-1">
              Manage and approve customer requests to unlock their flex
              channels.
            </p>
          </div>
          <Button onClick={fetchRequests} variant="outline" disabled={loading}>
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" /> Pending Approvals
            </CardTitle>
            <CardDescription>
              Customers waiting for a 6-digit code to modify their channels.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center p-12 border-2 border-dashed rounded-xl bg-muted/20">
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4 opacity-50" />
                <h3 className="text-lg font-semibold">All caught up!</h3>
                <p className="text-muted-foreground">
                  No pending flex code requests.
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((req) => (
                      <TableRow key={req.request_id}>
                        <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                          {new Date(req.created_at).toLocaleDateString()} <br />
                          {new Date(req.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {req.first_name} {req.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {req.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="font-semibold bg-primary/5"
                          >
                            {req.nickname || "Unnamed Subs"}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1 font-mono">
                            ID: {req.subscription_id.substring(0, 8)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            onClick={() =>
                              handleApprove(
                                req.request_id,
                                req.subscription_id,
                                req.email
                              )
                            }
                            disabled={processingId === req.request_id}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            {processingId === req.request_id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <KeyRound className="h-4 w-4 mr-2" />
                            )}
                            Generate Code
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CODE DISPLAY MODAL */}
      <Dialog open={showCodeModal} onOpenChange={setShowCodeModal}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              Unlock Code Generated
            </DialogTitle>
            <DialogDescription className="text-center">
              Please provide this 6-digit code to the customer ({customerEmail}
              ).
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="bg-muted p-6 rounded-xl border-2 border-primary/20 w-full max-w-xs relative">
              <span className="text-5xl font-black tracking-widest font-mono text-foreground">
                {generatedCode}
              </span>
            </div>

            <Button
              onClick={copyToClipboard}
              variant="secondary"
              className="w-full max-w-xs"
            >
              <Copy className="h-4 w-4 mr-2" /> Copy to Clipboard
            </Button>
          </div>

          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setShowCodeModal(false)} variant="outline">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FlexRequests;
