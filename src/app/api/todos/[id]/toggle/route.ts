import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {TodoDataAccess} from "@/lib/db";
import {authOptions} from "@/lib/auth";

export async function POST(
  request: NextRequest,
  {params}: {params: {id: string}},
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user || null;
    const id = params.id;

    const todoAccess = new TodoDataAccess(user);
    const todo = await todoAccess.toggleTodo(id);

    return NextResponse.json(todo);
  } catch (error: unknown) {
    console.error("TOGGLE todo error:", error);

    if (error instanceof Error) {
      if (error.message?.includes("Unauthorized")) {
        return NextResponse.json({error: error.message}, {status: 401});
      }

      if (error.message?.includes("Forbidden")) {
        return NextResponse.json({error: error.message}, {status: 403});
      }

      if (error.message?.includes("not found")) {
        return NextResponse.json({error: error.message}, {status: 404});
      }
    }

    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}
