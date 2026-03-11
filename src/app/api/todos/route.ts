import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {TodoDataAccess, initializeDb} from "@/lib/db";
import {authOptions} from "@/lib/auth";

// 初始化数据库
initializeDb().catch(console.error);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user || null;

    const todoAccess = new TodoDataAccess(user);
    const todos = await todoAccess.findTodos();

    return NextResponse.json(todos);
  } catch (error: any) {
    console.error("GET todos error:", error);

    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({error: error.message}, {status: 403});
    }

    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user || null;

    if (!user) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const data = await request.json();

    if (!data.title) {
      return NextResponse.json({error: "Title is required"}, {status: 400});
    }

    const todoAccess = new TodoDataAccess(user);
    const todo = await todoAccess.createTodo(data);

    return NextResponse.json(todo, {status: 201});
  } catch (error: any) {
    console.error("POST todo error:", error);

    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({error: error.message}, {status: 403});
    }

    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({error: error.message}, {status: 401});
    }

    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}
