import axios from "axios";
import { NextResponse } from "next/server";
export async function POST(req) {

    const { message, model, parentModel } = await req.json();

    try {
        const response = await axios.post(
            "https://kravixstudio.com/api/v1/chat",
            {
                message: message, // Messages to AI
                aiModel: model,                     // Selected AI model
                outputType: "text"                         // 'text' or 'json'
            },
            {
                headers: {
                    "Content-Type": "application/json",     // Tell server we're sending JSON
                    "Authorization": "Bearer " + process.env.KRAVIXSTUDIO_API_KEY  // Replace with your API key
                }
            }
        );

        console.log(response.data); // Log API response
        return NextResponse.json({
            ...response.data,
            model: parentModel
        });
    } catch (error) {
        console.error("API error details:", error.response?.data || error.message);
        return NextResponse.json(
            { error: error.response?.data || "Internal Server Error" },
            { status: error.response?.status || 500 }
        );
    }
}