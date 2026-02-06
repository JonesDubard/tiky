// app/lib/payment/mock-webhook.ts
export async function triggerMockWebhook(transactionRef: string) {
  try {
    // Simulate webhook delay (like MTN MoMo would call us)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = await fetch(
      `/api/payment/webhook?transactionId=${encodeURIComponent(transactionRef)}&status=SUCCESSFUL`
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Webhook simulation failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to trigger mock webhook:', error);
    return null;
  }
}