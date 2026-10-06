import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import {
  ChevronDown,
  ChevronRight,
  Radio,
  Users,
  Trophy,
  Clock3,
  CircleDollarSign,
  User,
} from "lucide-react";
import PlayerService from "@/service/PlayerService";
import { io } from "socket.io-client";
import { BACKEND_URL, TOTAL_PLAYER, roomId } from "../constants";

import { toast } from 'sonner';
import TeamService from "@/service/TeamService";


const LiveAuctionTeam: React.FC = () => {
    const baseAmount = 1000;

  const location = useLocation();

  let teamData  = location.state?.teamData || JSON.parse(localStorage.getItem('teamData') || '{}');

  localStorage.setItem("teamData", JSON.stringify(teamData))

  const [status, setStatus] = useState<string | null>(null);

    const [openTeam, setOpenTeam] = useState<string | null>(null);
    const isMobile = window.innerWidth < 768;
    const [socket, setSocket] = useState<any>(null);
    const [currentBidPlayer, setcurrentBidPlayer] = useState<any>({});
    const [currentBid, setCurrentBid] = useState<any>({});
    const [currentCall, setCurrentCall] = useState<any>({});
    const [soldPlayer, setSoldPlayer] = useState<any>({});
    const [allSoldPlayers, setAllSoldPlayer] = useState<any>([])
    const [popUpContent, setPopUpContent] = useState<any>({})
    const [openPopUp, setOpenPopUp] = useState(false);
    const [allTeams, setAllTeams] = useState<any>([])
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [soldCount, setSoldCount] = useState(0);
    const [unSoldCount, setUnSoldCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [playersByTeam, setPlayersByTeam] = useState<any>({});
    const [loadingTeam, setLoadingTeam] = useState<string | null>(null);
    const [auctionStatus, setAuctionStatus] = useState<string>('LIVE');
    const [unSoldPlayer, setUnSoldPlayer] = useState<any>({});
    const [nextBid, setNextBid] = useState(baseAmount)

  const [currentTeam, setCurrentTeam] = useState("");
  const [timeLeft, setTimeLeft] = useState(25);
  const [isConnected, setIsConnected] = useState(true);
  const [bidHistory, setBidHistory] = useState([]);
  const [showCallAnimation, setShowCallAnimation] = useState(false);
  const [callStage, setCallStage] = useState("1st Call");
  const [buttonDisable, setButtonDisable]= useState(false)
  const [activeTab, setActiveTab] = useState("teams");
  const [auctionedPlayers, setAuctionedPlayers] = useState([])
  const [auction, setAuction] = useState<any>({})

  const myTeam = teamData.team_name
  const purse = teamData.total_points;
  const max_bid = teamData.max_bid_amount;
  const remainingPurse = teamData?.total_points;


  useEffect(()=>{
    GetAllPlayers();
    GetAllTeams();
  },[])
  

    useEffect(() => {

      if(!teamData?.id){
        console.log("taking from local storage")
        teamData = JSON.parse(localStorage.getItem('teamData') || '{}')
      }

      
      const newSocket = io(BACKEND_URL, {
        transports: ["websocket"], // 👈 prefer websocket only
        withCredentials: true,
  
        reconnection: true,
        reconnectionAttempts: Infinity,   // 👈 keep trying
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });
  
      setSocket(newSocket);
  
      // 👇 Connection logs (VERY IMPORTANT)
      newSocket.on("connect", () => {
        console.log("Connected:", newSocket.id);
         newSocket.emit("join-room", roomId);
         newSocket.emit("get-auction-state", {
              roomId,
            });
      });
  
      newSocket.on("disconnect", (reason) => {
        console.log("Disconnected:", reason);
      });
  
      newSocket.on("reconnect_attempt", () => {
        console.log("Reconnecting...");
      });
  
      newSocket.on("reconnect", () => {
        console.log("Reconnected!");
        newSocket.emit("join-room", roomId);
        newSocket.emit("get-auction-state", {
              roomId,
            });
       
      });
      const handleFocus = () => {
        if (!newSocket.connected) {
          console.log("Focus reconnect...");
          newSocket.connect();
          newSocket.emit("join-room", roomId);
          newSocket.emit("get-auction-state", {
              roomId,
            });
        }
      };
  
      const interval = setInterval(() => {
        if (!newSocket.connected) {
          console.log("Heartbeat reconnect...");
          newSocket.connect();
          newSocket.emit("join-room", roomId);
          newSocket.emit("get-auction-state", {
                roomId,
              });
        }
      }, 5000);
  
  
      // ✅ 🔥 HANDLE MOBILE SCREEN OFF / ON
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          console.log("App came back to foreground");
          console.log(newSocket.connected);
          if (!newSocket.connected) {
            console.log("Manually reconnecting...");
            newSocket.connect();
            newSocket.emit("join-room", roomId);
            newSocket.emit("get-auction-state", {
              roomId,
            });
          }
        }
      };
  
      document.addEventListener("visibilitychange", handleVisibilityChange);
  
      return () => {
        clearInterval(interval);
        window.removeEventListener("focus", handleFocus);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        newSocket.off();
        newSocket.disconnect();
      };
    }, []);

     const parseData = (data: any) => {
    return typeof data === "string" ? JSON.parse(data) : data;
  };


  const getPlayerById =(playerId:any)=>{

     PlayerService()
            .GetNonBidPlayers(playerId)
            .then((response: any) => {
              setcurrentBidPlayer(response?.data)
            });
  }


      useEffect(() => {
        if (socket) {

          socket.on('auction-state', (message:any)=>{
            console.log("message==auction-state ", message);
            getPlayerById(message.playerId)
            setCurrentBid(message);
            setAuction(message);
          })

          socket.on("current_player", (message: any) => {
            console.log("current_player ---- ", message);
            setSoldPlayer({});
            setCurrentCall({})
            setUnSoldPlayer({})
            setcurrentBidPlayer(parseData(message));
            setCurrentBid({});
            setTimeLeft(25);
            setNextBid(baseAmount)
            setBidHistory([])
            setButtonDisable(false)
          });

          socket.on("team_call", (message: any) => {
            console.log("team_call ---- ", message);
            setSoldPlayer({});
            setUnSoldPlayer({})
            setCurrentCall(parseData(message));
          });

          socket.on("player_sold", (message: any) => {
            setUnSoldPlayer({})
            console.log("player_sold ---- ", message);
            let player = JSON.parse(message)
            setCurrentBid({})
            setSoldPlayer(player);
            setCurrentCall({})
            // toast.success(`${player.player_name} sold to ${player.team_name} for ${player.bid_amount}`)
            getSoldPlayers();
            GetAllTeams();
            setSoldCount(prev => prev + 1);
            setPendingCount(prev => prev - 1)
            GetTeamPlayers();
            setAuction({})
          });
    
          socket.on("player_unsold", (message: any) => {
            console.log("player_unsold ---- ", message);
            let player = JSON.parse(message)
            setCurrentBid({})
            setUnSoldPlayer(player);
            setCurrentCall({})
            setSoldPlayer({})
            // toast.success(`${player.player_name} Unsold`)
            // GetAllTeams();
            GetTeamPlayers();
            setUnSoldCount(prev => prev + 1);
            setPendingCount(prev => prev - 1)
            setAuction({})
          });
    
          socket.on("team_complete", (message: any) => {
            setOpenPopUp(true);
            setPopUpContent(JSON.parse(message));
            setTimeout(()=>{
                setOpenPopUp(false);
            },3000)
          })
    
          socket.on("close_popup", (message: any) => {
            setOpenPopUp(false);
          })

          const handleAuctionStarted = (data :any) => {
          console.log("Auction started:", data);
            setCurrentBid({})
            setAuction(data);
          };
          socket.on("auction-started", handleAuctionStarted);


          const handleBidUpdated = (data:any) => {

            console.log("bid updated-- ", data);
            setCurrentBid(data);
            setAuction(data);
          };

          socket.on("bid-updated", handleBidUpdated);

          return () => {
            socket.off("auction-started", handleAuctionStarted);
            socket.off("bid-updated", handleBidUpdated);
          };

    
    
        }
      }, [socket]);


// useEffect(() => {
//   if (!auction) return;


//   console.log("auction.status----- ", auction.status)


//   setStatus(auction.status);

//   if(auction.status !== 'BIDDING'){
//     setButtonDisable(true)
//   }else{
//     setButtonDisable(false)
//   }

//   if (auction.status === "PAUSED") {
//     setTimeLeft(
//       Math.ceil((auction.remainingMs || 0) / 1000)
//     );
//     return;
//   }

//   if (!auction.endsAt) {
//     setTimeLeft(0);
//     return;
//   }

//   const updateTimer = () => {
//     const remaining = Math.max(
//       0,
//       Math.ceil(
//         (auction.endsAt - Date.now()) / 1000
//       )
//     );

//     setTimeLeft(remaining);
//   };

//   updateTimer();

//   const timer = setInterval(updateTimer, 250);

//   return () => clearInterval(timer);
// }, [
//   auction?.status,
//   auction?.endsAt,
//   auction?.remainingMs
// ]);



  useEffect(() => {
  if (!auction) return;

  console.log("auction.status:", auction.status);

  setStatus(auction.status);

  // Stop timer completely when paused
  if (auction.status === "PAUSED") {
    setButtonDisable(true);

    setTimeLeft(
      Math.ceil((auction.remainingMs || 0) / 1000)
    );

    return;
  }

  if (auction.status !== "BIDDING") {
    setButtonDisable(true);
    setTimeLeft(0);
    return;
  }

  setButtonDisable(false);

  if (!auction.endsAt) {
    setTimeLeft(0);
    return;
  }

  const updateTimer = () => {
    const remaining = Math.max(
      0,
      Math.ceil((new Date(auction.endsAt).getTime() - Date.now()) / 1000)
    );

    setTimeLeft(remaining);
  };

  updateTimer();

  const timer = setInterval(updateTimer, 250);

  return () => {
    clearInterval(timer);
  };

}, [
  auction?.status,
  auction?.endsAt,
  auction?.remainingMs
]);


  
    useEffect(() => {
      console.log("Updated playersByTeam:", playersByTeam);
      setPlayersByTeam(playersByTeam)
    }, [playersByTeam]);

      const GetAllTeams = () => {
        try {
          PlayerService()
            .getAllTeams()
            .then((response: any) => {
              setAllTeams(response?.data);
              let allTms = response?.data || [];

            allTms.forEach(element => {

              if(element.id == teamData.id){
                teamData.max_bid_amount = element.max_bid_amount;
                teamData.total_points = element.total_points
              }
              
              })

            });
        } catch (error) {
          console.error("Error fetching players:", error);
        }
      };

    const SaveBidHistory = async(currentBid:any) =>{

      let params = {
        player_id : currentBidPlayer.id,
        team_id : teamData.id,
        team_name : teamData.team_name,
        bid_amount : currentBid.bid_amount
      }

      let response = await TeamService().addBidHistory(params);

      console.log("SaveBidHistory response== ", response?.data);
      GetBidHistory(currentBidPlayer);

      let updateAuction = {
        current_player_id : currentBidPlayer.id,
        current_team_id : teamData.id,
        current_bid : currentBid.bid_amount,
        status : 'BIDDING'
      }

      let stateResponse = await TeamService().updateAuctionState(updateAuction);

      console.log("updateAuction response== ", stateResponse?.data)



    }


    const GetAuctionState = async()=>{
      if(!currentBidPlayer?.id) return;
      let response = await TeamService().getAuctionState(currentBidPlayer?.id);
      console.log("getAuctionState response== ", response?.data);

      if(response?.data?.status === 'BIDDING'){
        setAuctionStatus('LIVE')
      }else if(response?.data?.status === 'PAUSED'){
        setAuctionStatus('PAUSED')
      }else if(response?.data?.status === 'COMPLETE'){
        setAuctionStatus('COMPLETE')
      }

      // if(response?.data?.current_player_id){
      //   let playerResponse = await PlayerService().getPlayerById(response?.data?.current_player_id);
      //   setcurrentBidPlayer(playerResponse?.data);
      // }

      // if(response?.data?.current_team_id){
      //   let teamResponse = await PlayerService().getTeamById(response?.data?.current_team_id);
      //   console.log("teamResponse== ", teamResponse?.data);
      //   // setCurrentBidTeam(teamResponse?.data);
      // }

      // if(response?.data?.current_bid){
      //   let bid = response?.data?.current_bid;
      //   console.log("bid== ", bid);
      //   setNextBid(bid + baseAmount)
      // }

    }

    const GetBidHistory = async (currentPlayer:any)=>{
      try{
        console.log("currentBidPlayer== ", currentBidPlayer);
        if(!currentPlayer?.id){
          currentPlayer = currentBidPlayer;
        }
        if(currentPlayer && currentPlayer.id){
          let response = await TeamService().getBidHistory(currentPlayer.id);
          console.log("bid history response== ", response?.data);
          setBidHistory(response?.data);
          setCurrentBid(response?.data?.[0])
          let nextBid = (response?.data?.[0]?.bid_amount || 0) + baseAmount
          setNextBid(nextBid);
        }

      }catch(e){
        console.log("error in GetBidHistory", e)
      }
    }
    
  
  
    const GetAllPlayers = async () => {
      try {
        let params = {
          offset: 0,
          teamId: null
        }
        PlayerService().getAllPlayers(params).then((response: any) => {
          setSoldCount(response?.data?.soldPlayerCount);
          setUnSoldCount(response?.data?.unSoldPlayerCount);
          setPendingCount(response?.data?.pendingPlayerCount);

          if(response?.data?.players?.length == TOTAL_PLAYER){
            setAuctionStatus("TEAM COMPLETE");
          }
  
          if(response?.data?.unSoldPlayerCount==0 && response?.data?.pendingPlayerCount==0){
              setAuctionStatus("COMPLETE");
          }
  
        })
      } catch (err) {
  
      }
    }


    const GetTeamPlayers = async () => {
      try {
        let params = {
          offset: 0,
          teamId: teamData.id
        }
        PlayerService().getAllPlayers(params).then((response: any) => {
          
          setAuctionedPlayers(response?.data?.players)

          if(response?.data?.players?.length == TOTAL_PLAYER){
            setAuctionStatus("TEAM COMPLETE");
          }
  
          if(response?.data?.unSoldPlayerCount==0 && response?.data?.pendingPlayerCount==0){
              setAuctionStatus("COMPLETE");
          }
  
        })
      } catch (err) {
  
      }
    }


     const getSoldPlayers = () => {
    
        PlayerService().getSoldPlayers().then((response: any) => {
          setAllSoldPlayer(response?.data?.players);
        })
      }



  // Countdown
  // useEffect(() => {
  //   if (timeLeft <= 0) return;

  //   const timer = setInterval(() => {
  //     setTimeLeft((prev) => prev - 1);
  //   }, 1000);

  //   return () => clearInterval(timer);
  // }, [timeLeft]);


  const placeBid = async () => {
    setButtonDisable(true);
    if (nextBid > max_bid) {
      alert("Insufficient purse!");
      return;
    }

    // let currentBid = {player_id: currentBidPlayer.id ,player_name : currentBidPlayer.fullname,team_id:teamData.id, 'team_name' :teamData.team_name, 'bid_amount':nextBid }


    socket.emit('place-bid', ({roomId, playerId:currentBidPlayer.id, teamId: teamData.id, teamName:teamData.team_name, bidAmount: (currentBid.nextBid || 1000)}) )

    // await SaveBidHistory(currentBid);


    // await PlayerService().EmitCurrentBid(currentBid).then((response: any) => {})
    // GetBidHistory(currentBidPlayer)

    if (currentTeam === myTeam) {
      return;
    }

    




    setCurrentTeam(myTeam);

    setBidHistory((prev) => [
      {
        team: myTeam,
        amount: nextBid,
      },
      ...prev,
    ]);

     setButtonDisable(false);

    // Reset auction timer
    // setTimeLeft(10);
  };

 

  return (
    <div className="min-h-screen bg-slate-950 text-white">


      {openPopUp && (
  <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center">
    {/* Popup */}
    <div className="pointer-events-auto relative animate-in zoom-in-90 fade-in duration-300">
      <div className="relative w-[320px] overflow-hidden rounded-3xl border border-emerald-400/30 bg-[#0b1220]/95 px-6 py-6 text-center shadow-2xl shadow-emerald-500/20 backdrop-blur-xl sm:w-[380px]">

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setOpenPopUp(false)}
          className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Glow */}
        <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-amber-400/20 blur-3xl" />

        <div className="relative">

      
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-400">
            Congratulations!
          </p>

          {/* Team Logo */}
          <div className="mx-auto mt-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg">
            {popUpContent.team_logo ? (
              <img
                src={`https://storage.googleapis.com/rajas_pl/${popUpContent.team_logo}`}
                alt={popUpContent.team_name}
                className="h-full w-full object-contain p-2"
              />
            ) : (
              <span className="text-3xl">🏆</span>
            )}
          </div>

          {/* Team Name */}
          <h2 className="mt-3 text-2xl font-black text-white">
            {popUpContent.team_name}
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Squad completed successfully!
          </p>

          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-lg">🏆</span>

            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Auction Complete
            </span>

            <span className="text-lg">🏆</span>
          </div>
        </div>

        {/* Auto-close progress */}
        <div className="absolute bottom-0 left-0 h-1 w-full overflow-hidden bg-white/5">
          <div className="h-full animate-[shrink_4s_linear_forwards] bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />
        </div>
      </div>
    </div>
  </div>
)}


      {showCallAnimation && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="flex flex-col items-center animate-call-popup">

      {/* Hammer */}
      <div className="text-7xl animate-hammer">
        🔨
      </div>

      {/* Call text */}
      <div className="mt-4 text-6xl font-black text-white uppercase tracking-wider animate-call-text">
        {callStage}
      </div>

    </div>
  </div>
)}



      {soldPlayer?.id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="sold-stamp">
            SOLD
            </div>
        </div>
        )}

        {unSoldPlayer?.id && (
       <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="unsold-stamp">
            UNSOLD
            </div>
        </div>
        )}


      {/* ================= HEADER ================= */}
      <header className="border-b border-slate-800 bg-slate-900/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">

          <div>
            <h1 className="text-xl font-extrabold sm:text-2xl">
              BK Auctions
            </h1>

            <p className="text-xs text-slate-400 sm:text-sm">
              Real Cricket League 2026
            </p>
          </div>


          <section className="grid grid-cols-3 gap-2 sm:gap-3">

  {/* Sold */}
  <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 sm:px-4 sm:py-3">
    <div className="flex items-center justify-between gap-2">
      <div>
        <p className="text-[9px] font-medium uppercase tracking-wider text-emerald-400 sm:text-[10px]">
          Sold
        </p>

        <p className="mt-0.5 text-lg font-black leading-none text-emerald-300 sm:text-xl">
          {soldCount}
        </p>
      </div>
    </div>

    <div className="absolute bottom-0 left-0 h-[2px] w-full bg-emerald-500" />
  </div>

  {/* Pending */}
  <div className="relative overflow-hidden rounded-xl border border-orange-500/20 bg-orange-500/10 px-3 py-2 sm:px-4 sm:py-3">
    <div className="flex items-center justify-between gap-2">
      <div>
        <p className="text-[9px] font-medium uppercase tracking-wider text-orange-400 sm:text-[10px]">
          Pending
        </p>

        <p className="mt-0.5 text-lg font-black leading-none text-orange-300 sm:text-xl">
          {pendingCount}
        </p>
      </div>
    </div>

    <div className="absolute bottom-0 left-0 h-[2px] w-full bg-orange-500" />
  </div>

  {/* Unsold */}
  <div className="relative overflow-hidden rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 sm:px-4 sm:py-3">
    <div className="flex items-center justify-between gap-2">
      <div>
        <p className="text-[9px] font-medium uppercase tracking-wider text-red-400 sm:text-[10px]">
          Unsold
        </p>

        <p className="mt-0.5 text-lg font-black leading-none text-red-300 sm:text-xl">
          {unSoldCount}
        </p>
      </div>
    </div>

    <div className="absolute bottom-0 left-0 h-[2px] w-full bg-red-500" />
  </div>

</section>


          
        </div>
      </header>


      {/* ================= MAIN ================= */}
      
      <main className="mx-auto max-w-7xl px-4 py-5">

        {/* Status */}
        <div className="mb-5 flex items-center justify-between">

          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-md bg-red-600 px-2 py-1 text-xs font-bold">
                LIVE
              </span>

              <span className="text-sm text-slate-400">
                {teamData.team_name}
              </span>
            </div>
          </div>

        </div>


        {/* ================= GRID ================= */}
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
         
          {/* ================= PLAYER CARD ================= */}
           {currentBidPlayer && currentBidPlayer.id &&
         <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">

  {/* Player Image */}
  <div className="relative h-[360px] overflow-hidden bg-slate-950 sm:h-[420px]">

    <img
      src={`https://storage.googleapis.com/rajas_pl/${currentBidPlayer.profile_image}`}
      alt={currentBidPlayer.fullname}
      className="h-full w-full object-contain"
    />

    {/* Bottom Gradient */}
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />

    {/* Player ID */}
    <div className="absolute left-4 top-4 rounded-lg bg-black/60 px-3 py-1.5 backdrop-blur">
      <p className="text-[9px] uppercase tracking-widest text-slate-400">
        Player ID
      </p>
      <p className="text-sm font-black text-orange-400">
        #{currentBidPlayer.id}
      </p>
    </div>

    <div className="absolute right-5 top-5">

                    <div
                      className={`flex h-20 w-20 flex-col items-center justify-center rounded-full border-4 ${
                        timeLeft <= 3
                          ? "border-red-500 bg-red-500/20"
                          : "border-orange-400 bg-orange-500/20"
                      }`}
                    >
                      <span className="text-2xl font-black">
                        {timeLeft}
                      </span>

                      <span className="text-[9px] uppercase">
                        seconds
                      </span>
                    </div>

                  </div> 


    {/* Player Info Overlay */}
    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">

      {/* Role */}
      <span className="inline-block rounded-full bg-orange-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-400">
        {currentBidPlayer.player_role}
      </span>

      {/* Name */}
      <h3 className="mt-1 text-2xl font-black leading-tight text-white sm:text-3xl">
        {currentBidPlayer.fullname}
      </h3>

      {/* Location */}
      <p className="mt-1 text-xs text-slate-300">
        📍 {currentBidPlayer.location}
      </p>

      {/* Details */}
      <div className="mt-3 grid grid-cols-3 gap-2">

        <div className="rounded-lg bg-black/50 px-2 py-2 backdrop-blur">
          <p className="text-[8px] uppercase tracking-wider text-slate-400">
            Batting
          </p>
          <p className="mt-0.5 truncate text-[11px] font-bold text-white">
            {currentBidPlayer.batting_style || "-"}
          </p>
        </div>

        <div className="rounded-lg bg-black/50 px-2 py-2 backdrop-blur">
          <p className="text-[8px] uppercase tracking-wider text-slate-400">
            Bowling
          </p>
          <p className="mt-0.5 truncate text-[11px] font-bold text-white">
            {currentBidPlayer.bowling_style || "-"}
          </p>
        </div>

        <div className="rounded-lg bg-black/50 px-2 py-2 backdrop-blur">
          <p className="text-[8px] uppercase tracking-wider text-slate-400">
            Jersey
          </p>
          <p className="mt-0.5 text-[11px] font-bold text-white">
            {currentBidPlayer.jersey_no || "-"}
          </p>
        </div>

      </div>

    </div>
  </div>

</section>
          }


          {/* ================= BIDDING PANEL ================= */}
          <aside className="space-y-4">

            {/* Bid button */}
            {auctionStatus !== "TEAM COMPLETE" && 
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">

              <p className="mb-2 text-center text-xs uppercase text-slate-500">
                Next Bid : {currentBid.nextBid || 1000}
              </p>
             
              <button
                onClick={placeBid}
                disabled={
                  buttonDisable ||
                  currentBid?.teamName == teamData.team_name ||
                  currentBid?.nextBid > max_bid ||
                  timeLeft <= 0
                }
                className={`w-full rounded-2xl py-5 text-lg font-black transition ${
                  currentBid?.teamName == teamData.team_name ||
                  buttonDisable ||
                  currentBid?.nextBid > max_bid ||
                  timeLeft <= 0
                    ? "cursor-not-allowed bg-slate-700 text-slate-500"
                    : "bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-400 active:scale-[0.98]"
                }`}
              >
                {currentBid?.teamName == teamData.team_name
                  ? "YOU ARE HIGHEST BIDDER"
                  : timeLeft <= 0
                  ? "BIDDING CLOSED"
                  : `BID ${currentBid.nextBid || 1000}`}
              </button>

            </div> 
            }


            {/* Current bid */}
            <div className="rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-slate-900 p-6">

              <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                Current Bid
              </p>

              <p className="mt-2 text-center text-4xl font-black text-orange-400 sm:text-5xl">
                {currentBid?.currentBid}
              </p>

              <div className="mt-3 text-center">

                <span className="text-xs text-slate-500">
                  Highest Bidder
                </span>

                <p className="font-bold">
                  {currentBid?.teamName}
                </p>

              </div>

            </div>


            {/* Your purse */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-xs text-slate-500">
                    YOUR PURSE
                  </p>

                  <p className="mt-1 text-xl font-black">
                    {(remainingPurse)}({teamData.player_count}/{TOTAL_PLAYER})
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-500/10 px-3 py-2 text-right">
                  <p className="text-[10px] text-slate-500">
                    MAX BID
                  </p>

                  <p className="font-bold text-emerald-400">
                    {(max_bid)}
                  </p>
                </div>

              </div>

            </div>


            


            {/* Bid history */}
            {/* <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">

              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold">
                  Bid History
                </h3>

                <span className="text-xs text-slate-500">
                  LIVE
                </span>
              </div>

              <div className="space-y-2">

                {bidHistory.slice(0, 5).map((bid, index) => (

                  <div
                    key={index}
                    className={`flex items-center justify-between rounded-xl p-3 ${
                      index === 0
                        ? "bg-orange-500/10"
                        : "bg-slate-800/50"
                    }`}
                  >

                    <div className="flex items-center gap-3">

                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-bold">
                        {index + 1}
                      </div>

                      <div>
                        <p className="text-sm font-semibold">
                          {bid.team_name}
                        </p>

                        {index === 0 && (
                          <p className="text-[10px] text-orange-400">
                            Highest Bid
                          </p>
                        )}
                      </div>

                    </div>

                    <p className="font-bold">
                      {(bid.bid_amount)}
                    </p>

                  </div>

                ))}

              </div>

            </div>  */}


            {/* Team / Auctioned Players Section */}

          </aside>


          <div className="mt-6 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0f] shadow-2xl">

  {/* Tabs */}
  <div className="border-b border-white/10 bg-black/50">
    <div className="grid grid-cols-2">

      {/* Teams Tab */}
      <button
        type="button"
        onClick={() => setActiveTab("teams")}
        className={`
          relative min-w-0 px-3 py-3.5 text-sm font-bold transition-all sm:px-4 sm:py-4
          ${
            activeTab === "teams"
              ? "bg-white/[0.04] text-white"
              : "text-gray-500 hover:text-gray-300"
          }
        `}
      >
        <div className="flex items-center justify-center gap-2">
          <Users className="h-4 w-4 flex-shrink-0" />

          <span className="truncate">
            Teams
          </span>

          <span className="flex h-5 min-w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-white/10 px-1.5 text-[10px]">
            {allTeams?.length || 0}
          </span>
        </div>

        {activeTab === "teams" && (
          <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-yellow-400 sm:left-6 sm:right-6" />
        )}
      </button>


      {/* Players Tab */}
      <button
        type="button"
        onClick={() => setActiveTab("players")}
        className={`
          relative min-w-0 px-3 py-3.5 text-sm font-bold transition-all sm:px-4 sm:py-4
          ${
            activeTab === "players"
              ? "bg-white/[0.04] text-white"
              : "text-gray-500 hover:text-gray-300"
          }
        `}
      >
        <div className="flex items-center justify-center gap-2">
          <Trophy className="h-4 w-4 flex-shrink-0" />

          <span className="truncate">
            Auctioned Players
          </span>

          <span className="flex h-5 min-w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-white/10 px-1.5 text-[10px]">
            {auctionedPlayers?.length || 0}
          </span>
        </div>

        {activeTab === "players" && (
          <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-yellow-400 sm:left-6 sm:right-6" />
        )}
      </button>

    </div>
  </div>


  {/* Content */}
  <div className="w-full p-4 sm:p-6">

    {/* ================= TEAMS ================= */}
    {activeTab === "teams" && (
      <div>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white">
              Teams
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              View participating teams
            </p>
          </div>

          <span className="w-fit flex-shrink-0 rounded-lg border border-yellow-400/20 bg-yellow-400/10 px-3 py-1.5 text-xs font-bold text-yellow-400">
            {allTeams?.length || 0} Teams
          </span>

        </div>


        {allTeams?.length > 0 ? (

          <div className="
            grid
            grid-cols-1
            gap-3
            sm:grid-cols-2
            xl:grid-cols-3
          ">

            {allTeams.map((team) => (

              <div
                key={team.id}
                className="
                  flex
                  min-w-0
                  items-center
                  gap-3
                  rounded-xl
                  border
                  border-white/[0.08]
                  bg-white/[0.03]
                  p-4
                  transition-all
                  hover:border-yellow-400/20
                  hover:bg-white/[0.06]
                "
              >

                {/* Team Icon */}
                <div className="
                  flex
                  h-11
                  w-11
                  flex-shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-yellow-400/20
                  bg-yellow-500/10
                  font-black
                  text-yellow-400
                ">
                  {team.team_name?.charAt(0)?.toUpperCase()}
                </div>


                {/* Team Name */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-100">
                    {team.team_name}
                  </p>

                  <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-600">
                    Team
                  </p>
                </div>


                {/* Max Bid */}
                <div className="w-[90px] flex-shrink-0 text-right">
                  <p className="text-[9px] uppercase tracking-wider text-gray-600">
                    Max Bid
                  </p>

                  <p className="mt-0.5 truncate text-sm font-black text-yellow-400">
                    ₹{Number(team.max_bid_amount || 0).toLocaleString("en-IN")}
                  </p>
                </div>

              </div>

            ))}

          </div>

        ) : (

          <div className="py-12 text-center text-sm text-gray-600">
            No teams available
          </div>

        )}

      </div>
    )}


    {/* ================= AUCTIONED PLAYERS ================= */}
    {activeTab === "players" && (
      <div>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white">
              Auctioned Players
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Players selected during the auction
            </p>
          </div>

          <span className="w-fit flex-shrink-0 rounded-lg border border-green-400/20 bg-green-400/10 px-3 py-1.5 text-xs font-bold text-green-400">
            {auctionedPlayers?.length || 0} Players
          </span>

        </div>


        {auctionedPlayers?.length > 0 ? (

          <div className="
            grid
            grid-cols-1
            gap-3
            sm:grid-cols-2
            xl:grid-cols-3
          ">

            {auctionedPlayers.map((player) => (

              <div
                key={player.id}
                className="
                  grid
                  min-w-0
                  grid-cols-[56px_minmax(0,1fr)_90px]
                  items-center
                  gap-3
                  rounded-xl
                  border
                  border-white/[0.08]
                  bg-white/[0.03]
                  p-3
                  transition-all
                  hover:border-yellow-400/20
                  hover:bg-white/[0.06]
                "
              >

                {/* Image */}
                <div className="
                  h-14
                  w-14
                  flex-shrink-0
                  overflow-hidden
                  rounded-xl
                  border
                  border-white/10
                  bg-white/[0.05]
                ">

                  {player.profile_image ? (

                    <img
                      src={`https://storage.googleapis.com/rajas_pl/${player.profile_image}`}
                      alt={player.fullname}
                      className="h-full w-full object-cover"
                    />

                  ) : (

                    <div className="flex h-full w-full items-center justify-center">
                      <User className="h-7 w-7 text-gray-600" />
                    </div>

                  )}

                </div>


                {/* Details */}
                <div className="min-w-0">

                  <p className="truncate text-sm font-bold text-gray-100">
                    {player.fullname}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    {player.player_role}
                  </p>

                  {player.team_name && (
                    <p className="mt-1 truncate text-[11px] font-semibold text-yellow-400">
                      {player.team_name}
                    </p>
                  )}

                </div>


                {/* Bid */}
                <div className="w-[90px] min-w-0 flex-shrink-0 text-right">

                  {player.bid_amount ? (
                    <>
                      <p className="text-[9px] uppercase tracking-wider text-gray-600">
                        Sold
                      </p>

                      <p className="mt-0.5 truncate text-sm font-black text-green-400">
                        ₹{Number(player.bid_amount).toLocaleString("en-IN")}
                      </p>
                    </>
                  ) : (
                    <span className="text-xs text-gray-600">
                      -
                    </span>
                  )}

                </div>

              </div>

            ))}

          </div>

        ) : (

          <div className="py-12 text-center text-sm text-gray-600">
            No players auctioned yet
          </div>

        )}

      </div>
    )}

  </div>
</div>

        </div>

      </main>
      

    </div>
  );
};


/* ================= INFO COMPONENT ================= */

const Info = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  return (
    <div className="border-r border-slate-800 p-4 last:border-r-0">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-bold">
        {value}
      </p>
    </div>
  );
};

export default LiveAuctionTeam;