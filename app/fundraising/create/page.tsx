"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MainNav } from "@/components/main-nav"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { CalendarIcon, ImageIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useWeb3 } from "@/lib/hooks/use-web3"
import { useFundraisingContract } from "@/lib/hooks/use-contracts"
import { useToast } from "@/components/ui/use-toast"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ImageUpload } from "@/components/image-upload"

export default function CreateFundraisingPage() {
  const router = useRouter()
  const { address } = useWeb3()
  const { toast } = useToast()
  const { createCampaign, loading } = useFundraisingContract()

  // Campaign details state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState("")
  const [goal, setGoal] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState("")

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a campaign",
        variant: "destructive",
      })
      return
    }

    if (!title || !description || !goal || !startDate || !endDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      // Create campaign on blockchain
      const campaignId = await createCampaign(
        title,
        description,
        goal,
        startDate,
        endDate,
      )

      if (!campaignId) {
        toast({
          title: "Failed to create campaign",
          description: "There was an error creating your campaign on the blockchain",
          variant: "destructive",
        })
        return
      }

      // Store additional data in Firebase
      const campaignData = {
        id: campaignId,
        title,
        description,
        goal: parseFloat(goal),
        current: 0,
        currency: "ETH",
        startDate,
        endDate,
        image: image || "/placeholder.jpg",
        creator: address,
        creatorAddress: address,
        creatorName: `${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
        category,
        tags: tags.split(",").map((tag) => tag.trim()),
        donations: [],
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      // Save to Firestore
      await addDoc(collection(db, "campaigns"), campaignData)

      toast({
        title: "Campaign created successfully",
        description: "Your fundraising campaign has been created and is now live",
      })

      // Redirect to fundraising page
      router.push(`/fundraising/${campaignId}`)
    } catch (error) {
      console.error("Error creating campaign:", error)
      toast({
        title: "Error creating campaign",
        description: (error as Error).message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen">
      <MainNav />

      <main className="container px-4 pt-24 pb-16 md:px-6 relative z-10">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Start a Fundraising Campaign</h1>
          <p className="text-zinc-400 mb-8">Fill in the details below to create your blockchain-powered fundraising campaign</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle>Campaign Information</CardTitle>
                <CardDescription>Provide the basic details about your campaign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Campaign Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter campaign title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Campaign Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your campaign and what the funds will be used for"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-32 bg-zinc-800/50 border-zinc-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign-image">Campaign Image</Label>
                  <ImageUpload 
                    value={image}
                    onChange={setImage}
                    disabled={loading}
                  />
                  <p className="text-xs text-zinc-400">Upload a cover image for your campaign. Recommended size 1200x600px.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal">Fundraising Goal (ETH)</Label>
                  <Input
                    id="goal"
                    placeholder="e.g., 10"
                    type="number"
                    step="0.01"
                    min="0"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-zinc-800/50 border-zinc-700",
                            !startDate && "text-zinc-500",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-zinc-800/50 border-zinc-700",
                            !endDate && "text-zinc-500",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                          disabled={(date) => date < (startDate || new Date())}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      placeholder="e.g., Tech, Charity, Environment"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="bg-zinc-800/50 border-zinc-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      placeholder="e.g., blockchain, community, innovation"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="bg-zinc-800/50 border-zinc-700"
                    />
                    <p className="text-xs text-zinc-500">Separate tags with commas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/fundraising")}
                className="bg-zinc-800/50 border-zinc-700"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Campaign...
                  </>
                ) : (
                  "Create Campaign"
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
