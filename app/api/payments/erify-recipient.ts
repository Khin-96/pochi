// pages/api/payments/verify-recipient.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { identifier, type } = req.body;

    if (!identifier || !type) {
      return res.status(400).json({ message: 'Missing identifier or type' });
    }

    // Here you would typically:
    // 1. Validate the identifier format (phone/email)
    // 2. Check your database for the user
    // 3. Return the appropriate response

    // Mock implementation - replace with actual database lookup
    const mockUsers = [
      { identifier: 'test@example.com', type: 'email', name: 'Test User' },
      { identifier: '+254712345678', type: 'phone', name: 'Test User' }
    ];

    const user = mockUsers.find(u => 
      u.identifier === identifier && u.type === type
    );

    if (user) {
      return res.status(200).json({
        verified: true,
        name: user.name,
        type,
        identifier
      });
    }

    return res.status(404).json({
      verified: false,
      message: 'Recipient not found'
    });

  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}