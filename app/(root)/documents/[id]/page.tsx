import { currentUser } from "@clerk/nextjs/server";
import CollaborativeRoom from "../../../../components/CollaborativeRoom";
import { redirect } from "next/navigation";
import { getDocument } from "../../../../lib/actions/room.actions";
import { getClerkUsers } from "../../../../lib/actions/user.actions";


const Document = async ({ params: { id } }: SearchParamProps) => {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const userEmail = clerkUser.emailAddresses[0].emailAddress;
  const room = await getDocument({
    roomId: id,
    userId: userEmail,
  });

  if (!room) redirect("/");

  // Check if the user is part of the room
  if (!room.usersAccesses[userEmail]) {
    throw new Error("Please sign up with this email to access the room.");
  }

  const userIds = Object.keys(room.usersAccesses);
  const users = await getClerkUsers({ userIds });

  // console.log("Fetched Users:", users); // Log users for debugging
  // console.log("Room Users Accesses:", room.usersAccesses); // Log room accesses for debugging

  const usersData = users
    .map((user: User) => {
      if (!user || !user.email) {
        console.error("Invalid user object:", user);
        return null;
      }

      return {
        ...user,
        userType: room.usersAccesses[user.email]?.includes("room:write")
          ? "editor"
          : "viewer",
      };
    })
    .filter(Boolean); // Filter out null values

  const currentUserType = room.usersAccesses[userEmail]?.includes("room:write")
    ? "editor"
    : "viewer";

  return (
    <main className="flex w-full flex-col items-center">
      <CollaborativeRoom
        roomId={id}
        roomMetadata={room.metadata}
        users={usersData}
        currentUserType={currentUserType}
      />
    </main>
  );
};

export default Document;
