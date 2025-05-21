"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { MainNav } from "@/components/main-nav"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Coins, Users, Clock, TrendingUp, Loader2 } from "lucide-react"
import Link from "next/link"
import { useFundraisingContract } from "@/lib/hooks/use-contracts"
import { useWeb3 } from "@/lib/hooks/use-web3"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function FundraisingPage() {
  const [activeTab, setActiveTab] = useState("active")
  const { contract, loading: contractLoading } = useFundraisingContract()
  const { provider } = useWeb3()
  const [campaigns, setCampaigns] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!contract || !provider) return
      
      try {
        setIsLoading(true)
        // Get campaign count from contract
        const campaignCount = await contract.campaignCount()
        const currentTimestamp = Math.floor(Date.now() / 1000)
        const campaignsArray = []
        
        // Fetch all campaigns
        for (let i = 1; i <= campaignCount; i++) {
          const campaignId = i.toString()
          try {
            const campaignData = await contract.campaigns(campaignId)
            const donations = await contract.getDonations(campaignId)
            
            // Calculate total raised
            let totalRaised = ethers.BigNumber.from("0")
            donations.forEach(donation => {
              totalRaised = totalRaised.add(donation.amount)
            })
              // Get metadata (including image) from Firebase
            let campaignMetadata = null
            try {
              // Query Firebase for the campaign metadata using the ID
              const q = query(collection(db, "campaigns"), where("id", "==", campaignId))
              const querySnapshot = await getDocs(q)
              
              if (!querySnapshot.empty) {
                campaignMetadata = querySnapshot.docs[0].data()
              }
            } catch (err) {
              console.error(`Error fetching campaign metadata ${campaignId}:`, err)
            }
            
            // Format campaign data
            const campaign = {
              id: campaignId,
              title: campaignData.title,
              description: campaignData.description,
              creator: campaignData.creator,
              creatorName: `${campaignData.creator.substring(0, 6)}...${campaignData.creator.substring(campaignData.creator.length - 4)}`,
              goal: ethers.utils.formatEther(campaignData.goal),
              raised: ethers.utils.formatEther(totalRaised),
              contributors: donations.length,
              startTimestamp: campaignData.startTime.toNumber(),
              endTimestamp: campaignData.endTime.toNumber(),
              deadline: new Date(campaignData.endTime.toNumber() * 1000).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              }),
              status: campaignData.endTime.toNumber() > currentTimestamp ? 'active' : 'completed',
              image: campaignMetadata?.image || "/placeholder.jpg" // Use uploaded image if available
            }
            
            campaignsArray.push(campaign)
          } catch (err) {
            console.error(`Error fetching campaign ${campaignId}:`, err)
            // Continue with next campaign instead of stopping the whole process
          }
        }
        
        setCampaigns(campaignsArray)
        setError(null)
      } catch (err) {
        console.error("Error fetching campaigns:", err)
        setError("Failed to load campaigns. Please check your connection and try again.")
      } finally {
        setIsLoading(false)
      }
    }
    
    if (contract && provider && !contractLoading) {
      fetchCampaigns()
    }
  }, [contract, provider, contractLoading])
  
  return (
    <div className="min-h-screen">
      <MainNav />

      <main className="container px-4 pt-24 pb-16 md:px-6 relative z-10">
        <section className="py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">Fundraising Campaigns</h1>
              <p className="text-zinc-400 mt-2">Support innovative Web3 projects and community initiatives</p>
            </div>            <Button 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              asChild
            >
              <Link href="/fundraising/create">
                <Coins className="mr-2 h-4 w-4" />
                Start a Campaign
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 text-purple-500 animate-spin mb-4" />
              <p className="text-zinc-400">Loading campaigns...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-red-500 mb-4">⚠️</div>
              <h3 className="text-xl font-medium">Error loading campaigns</h3>
              <p className="text-zinc-400 mt-2 max-w-md">
                {error}
              </p>
            </div>
          ) : (
            <Tabs defaultValue="active" className="mb-8">
              <TabsList className="mb-4">
                <TabsTrigger value="active" onClick={() => setActiveTab("active")}>Active Campaigns</TabsTrigger>
                <TabsTrigger value="trending" onClick={() => setActiveTab("trending")}>Trending</TabsTrigger>
                <TabsTrigger value="ending" onClick={() => setActiveTab("ending")}>Ending Soon</TabsTrigger>
                <TabsTrigger value="completed" onClick={() => setActiveTab("completed")}>Completed</TabsTrigger>
              </TabsList>
              
              <TabsContent value="active" className="mt-0">
                {campaigns.filter(campaign => campaign.status === 'active').length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {campaigns
                      .filter(campaign => campaign.status === 'active')
                      .map((campaign) => (
                        <FundraisingCard key={campaign.id} campaign={campaign} />
                      ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Coins className="h-12 w-12 text-zinc-400 mb-4" />
                    <h3 className="text-xl font-medium">No active campaigns</h3>
                    <p className="text-zinc-400 mt-2 max-w-md">
                      Be the first to start a fundraising campaign!
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="trending" className="mt-0">
                {campaigns.filter(campaign => campaign.status === 'active').length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {campaigns
                      .filter(campaign => campaign.status === 'active')
                      .sort((a, b) => b.contributors - a.contributors)
                      .map((campaign) => (
                        <FundraisingCard key={campaign.id} campaign={campaign} />
                      ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <TrendingUp className="h-12 w-12 text-zinc-400 mb-4" />
                    <h3 className="text-xl font-medium">No trending campaigns</h3>
                    <p className="text-zinc-400 mt-2 max-w-md">
                      Check back later for campaigns gaining momentum!
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="ending" className="mt-0">
                {campaigns.filter(campaign => {
                  const oneWeekFromNow = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
                  return campaign.status === 'active' && campaign.endTimestamp < oneWeekFromNow;
                }).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {campaigns
                      .filter(campaign => {
                        const oneWeekFromNow = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
                        return campaign.status === 'active' && campaign.endTimestamp < oneWeekFromNow;
                      })
                      .sort((a, b) => a.endTimestamp - b.endTimestamp)
                      .map((campaign) => (
                        <FundraisingCard key={campaign.id} campaign={campaign} />
                      ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Clock className="h-12 w-12 text-zinc-400 mb-4" />
                    <h3 className="text-xl font-medium">No campaigns ending soon</h3>
                    <p className="text-zinc-400 mt-2 max-w-md">
                      There are no active campaigns ending in the next week.
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="completed" className="mt-0">
                {campaigns.filter(campaign => campaign.status === 'completed').length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {campaigns
                      .filter(campaign => campaign.status === 'completed')
                      .map((campaign) => (
                        <FundraisingCard key={campaign.id} campaign={campaign} />
                      ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Coins className="h-12 w-12 text-zinc-400 mb-4" />
                    <h3 className="text-xl font-medium">No completed campaigns yet</h3>
                    <p className="text-zinc-400 mt-2 max-w-md">
                      Completed fundraising campaigns will appear here once they reach their goals or deadlines.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}

function FundraisingCard({ campaign }) {
  const percentageRaised = Math.min(Math.round((parseFloat(campaign.raised) / parseFloat(campaign.goal)) * 100) || 0, 100)
  const isCompleted = campaign.status === 'completed'
  
  return (
    <Card className={`border border-zinc-800 bg-zinc-900/50 backdrop-blur overflow-hidden ${isCompleted ? 'opacity-80' : ''}`}>
      <div className="h-48 overflow-hidden relative">
        <img 
          src={campaign.image} 
          alt={campaign.title}
          className={`w-full h-full object-cover transition-transform ${!isCompleted ? 'hover:scale-105 duration-300' : ''}`}
        />
        {isCompleted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-black/80 text-white text-xs font-bold px-3 py-1 rounded transform rotate-12">
              COMPLETED
            </div>
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{campaign.title}</CardTitle>
            <CardDescription className="text-zinc-400">By {campaign.creatorName}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3 space-y-3">
        <p className="text-sm line-clamp-2">{campaign.description}</p>
        
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-semibold">{parseFloat(campaign.raised).toFixed(2)} ETH raised</span>
            <span className="text-sm text-zinc-400">{percentageRaised}%</span>
          </div>
          <Progress value={percentageRaised} className="h-2 bg-zinc-800" />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-zinc-400">Goal: {parseFloat(campaign.goal).toFixed(2)} ETH</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center text-xs text-zinc-400">
          <div className="flex items-center">
            <Users className="h-3 w-3 mr-1" />
            <span>{campaign.contributors} contributor{campaign.contributors !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>{isCompleted ? 'Ended' : 'Ends'}: {campaign.deadline}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className={`w-full ${isCompleted 
            ? 'bg-zinc-600 hover:bg-zinc-700 cursor-default' 
            : 'bg-purple-600 hover:bg-purple-700'}`}
          disabled={isCompleted}
          asChild={!isCompleted}
        >
          {!isCompleted ? (
            <Link href={`/fundraising/${campaign.id}`}>
              Support Campaign
            </Link>
          ) : "Campaign Ended"}
        </Button>
      </CardFooter>
    </Card>
  )
}