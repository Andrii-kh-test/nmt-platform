import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  try {
    const response = await openai.responses.create({
      model: "gpt-5",
      input: "Відповідай одним словом: ПРАЦЮЄ",
    });

    return NextResponse.json({
      success: true,
      response: response.output_text,
    });
  } catch (error) {
    console.error("OPENAI TEST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}