// lib/amazon-connect.ts
import { ConnectClient, StartChatContactCommand } from "@aws-sdk/client-connect";
import { ConnectParticipantClient, CreateParticipantConnectionCommand, SendMessageCommand } from "@aws-sdk/client-connectparticipant";

const connectClient = new ConnectClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

const participantClient = new ConnectParticipantClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

export async function startChatContact(userEmail: string, userName: string, initialMessage?: string) {
  try {
    const command = new StartChatContactCommand({
      InstanceId: process.env.AMAZON_CONNECT_INSTANCE_ID!,
      ContactFlowId: process.env.AMAZON_CONNECT_CONTACT_FLOW_ID!,
      ParticipantDetails: {
        DisplayName: userName,
      },
      Attributes: {
        email: userEmail,
      },
      InitialMessage: initialMessage ? {
        ContentType: "text/plain",
        Content: initialMessage
      } : undefined,
    });

    const response = await connectClient.send(command);
    return response;
  } catch (error) {
    console.error("Error starting Amazon Connect chat:", error);
    throw error;
  }
}

export async function createParticipantConnection(contactId: string, participantToken: string) {
  try {
    const command = new CreateParticipantConnectionCommand({
      Type: ["WEBSOCKET", "CONNECTION_CREDENTIALS"],
      ParticipantToken: participantToken,
    });

    const response = await participantClient.send(command);
    return response;
  } catch (error) {
    console.error("Error creating participant connection:", error);
    throw error;
  }
}