"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mic, Send, StopCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { SpeechRecognition } from "@/components/speech-recognition"
import { processWithGemini } from "@/lib/gemini-service"
import { mavlink } from "@/lib/mavlink-interface"

type Message = {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hello! I'm your ArduPilot AI Assistant. How can I help you with your drone today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (content?: string) => {
    const text = content ?? input
    if (!text.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: text,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsProcessing(true)
    setError(null)

    try {
      // Get current vehicle state
      const vehicleState = mavlink.getState()

      // Process with Gemini API
      const response = await processWithGemini([...messages, userMessage], vehicleState)

      // Execute any actions returned by the AI
      if (response.actions && response.actions.length > 0) {
        for (const action of response.actions) {
          try {
            switch (action.type) {
              case "arm":
                await mavlink.arm()
                break
              case "disarm":
                await mavlink.disarm()
                break
              case "takeoff":
                await mavlink.takeoff((action.params?.altitude as number) || 10)
                break
              case "rtl":
                await mavlink.returnToLaunch()
                break
              case "setMode":
                await mavlink.setMode((action.params?.mode as string) || "GUIDED")
                break
              case "flyTo":
                await mavlink.flyTo(
                  (action.params?.lat as number) || vehicleState.latitude,
                  (action.params?.lon as number) || vehicleState.longitude,
                  (action.params?.alt as number) || vehicleState.altitude,
                )
                break
            }
          } catch (error) {
            console.error(`Failed to execute action ${action.type}:`, error)
          }
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.text,
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error processing message:", error)

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
      setError("Request failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSpeechResult = (transcript: string) => {
    setInput(transcript)
    setIsRecording(false)
    if (transcript.trim()) {
      handleSendMessage(transcript)
    }
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
  }

  return (
    <div className="flex flex-col h-[420px] rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
      <div className="border-b border-border/60 bg-muted/60 px-4 py-3">
        <h2 className="text-base font-semibold text-foreground">AI Assistant</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        {messages.map((message) => (
          <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                message.role === "user"
                  ? "bg-primary/90 text-primary-foreground"
                  : "bg-muted/80 text-foreground border border-border/60",
              )}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-muted/80 text-foreground border border-border/60">
              <div className="flex space-x-2">
                <div
                  className="w-2 h-2 rounded-full bg-primary/70 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-primary/70 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-primary/70 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 border-t">
        <div className="flex space-x-2">
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            onClick={toggleRecording}
            disabled={isProcessing}
          >
            {isRecording ? <StopCircle className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message or press the mic to speak..."
            className="flex-1 h-11 rounded-xl"
          />
          <Button onClick={() => handleSendMessage()} disabled={!input.trim() || isProcessing} className="h-11 rounded-xl px-5">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Speech recognition component */}
      <SpeechRecognition isListening={isRecording} onResult={handleSpeechResult} onEnd={() => setIsRecording(false)} />
    </div>
  )
}
