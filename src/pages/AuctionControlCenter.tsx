import React, { ChangeEvent, useEffect, useState } from "react";
import {
  Search,
  ArrowLeft,
  XCircle,
  BadgeDollarSign,
  RefreshCcw,
} from "lucide-react";
import PlayerService from "@/service/PlayerService";
import { BACKEND_URL, roomId, TOTAL_PLAYER } from "../constants";
import { io } from "socket.io-client";
import { toast } from 'sonner';

const AuctionPlayerPage: React.FC = () => {

  const baseAmount = 1000;
  const [allTeams, setAllTeams] = useState<any>([]);
  const [bidFlow, setBidFlow] = useState<any>([]);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [currentBidTeam, setCurrentBidTeam] = useState<any>({});
  const [players, setPlayers] = useState<any>([]);
  const [currentBidPlayer, setCurrentBidPlayer] = useState<any>({});
  const [searchText, setSearchText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [popUpContent, setPopUpContent] = useState<any>({})
  const [openPopUp, setOpenPopUp] = useState(false);
  const [socket, setSocket] = useState<any>(null);


   useEffect(() => {
      
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
       
      });
      const handleFocus = () => {
        if (!newSocket.connected) {
          console.log("Focus reconnect...");
          newSocket.connect();
          newSocket.emit("join-room", roomId);
        }
      };
  
      const interval = setInterval(() => {
        if (!newSocket.connected) {
          console.log("Heartbeat reconnect...");
          newSocket.connect();
          newSocket.emit("join-room", roomId);
        }
      }, 5000);
  
  
      // ✅ 🔥 HANDLE MOBILE SCREEN OFF / ON
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          console.log("App came back to foreground");
          console.log(newSocket.connected)
          if (!newSocket.connected) {
            console.log("Manually reconnecting...");
            newSocket.connect();
            newSocket.emit("join-room", roomId);
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

  useEffect(() => {
      if (socket) {

        socket.emit("join-room", roomId);

        socket.on("current_player", (data:any) => {
          console.log("Received:", data);
        });
        
      }
    }, [socket]);



  useEffect(() => {
    setBidFlow([]);
    setBidAmount(0);
    setCurrentBidTeam({})
    GetAllTeams();
    GetPlayer();
  }, []);


    const GetPlayer = () => {
    localStorage.setItem('close_popup', 'false');
    localStorage.setItem("team_complete",  JSON.stringify({}))
    console.log("searchText== ", searchText);
    setCurrentBidPlayer({});
    setPlayers([]);
    setBidFlow([]);
    setCurrentBidTeam({})
    setBidAmount(0)
    setIsLoading(true)
    PlayerService()
      .GetNonBidPlayers(searchText)
      .then((response: any) => {
        setIsLoading(false);
        let players = response?.data;
        setSearchText('')
        if (!players) {
          toast.success("No pending players");
          localStorage.setItem("selectedPlayer", JSON.stringify({}));
          localStorage.setItem("team_complete",  JSON.stringify({}))
          localStorage.setItem("currentBidTeam", JSON.stringify({}));
          localStorage.setItem('close_popup', 'false');
        }
        if (players?.id) {
          setCurrentBidPlayer(players);
          localStorage.setItem("selectedPlayer", JSON.stringify(players));
          localStorage.setItem("currentBidTeam", JSON.stringify({}));
          localStorage.setItem("team_complete",  JSON.stringify({}))
          localStorage.setItem('close_popup', 'false');
          PlayerService().displayPlayer(players).then((response: any) => {
      console.log("response== ", response);
    })
      socket.emit('current_player', JSON.stringify(players));
          
        } 
      });
  };

 

   const GetAllTeams = () => {
    try {
      PlayerService()
        .getAllTeams()
        .then((response: any) => {
          setAllTeams(response?.data);
        });
    } catch (error) {
      console.error("Error fetching players:", error);
    }
  };

  

  const player = {
    id: 101,
    name: "Virat Kohli",
    image:
      "https://placehold.co/250x250/png?text=Player",
  };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log("value=== ", value);
    setSearchText(value);
  };

  const cardClick = (team: any, index: number) => {
    console.log("bidFlow.value== ", bidFlow);
    if (bidFlow.length === 0) {
      let flow = [];
      let amount = bidAmount + baseAmount;
      if (amount > team.max_bid_amount) {
        toast.error('Bid amount larger than max amount')
      } else {
        setCurrentBidTeam(team);
        console.log("amount== ", amount);
        setBidAmount(amount);
        let flowItem = { id: team.id, team_name: team.team_name, amount: amount }
        flow.push(flowItem);
        localStorage.setItem("currentBidTeam", JSON.stringify(flowItem));
        console.log("flow== ", flow);
        socket.emit('team_call' , JSON.stringify(flow[flow.length - 1]))
        InvokeTeamCall(flow[flow.length - 1])
        setBidFlow(flow);
        console.log("bidFlow== ", bidFlow);
      }
    }
    if (bidFlow && bidFlow.length && bidFlow.length > 0) {
      if (bidFlow[bidFlow.length - 1].id !== team.id) {
        // let amount = bidAmount + baseAmount;
        let amount;
        let lastBidAmount = bidFlow[bidFlow.length - 1].amount;
        console.log("lastBidAmount=== ", lastBidAmount);
        if(lastBidAmount >= 10000){
        amount = bidAmount + 1000
        }else{
          amount = bidAmount + 1000
        }

        if (amount > team.max_bid_amount) {
          toast.error('Bid amount larger than max amount')
        } else {
          setCurrentBidTeam(team);
          
          // socket.emit('current_bid' , {'team_name' :team.team_name, 'points':amount })
          setBidAmount(amount);
          let flow = bidFlow;
          let flowItem = {
            id: team.id,
            team_name: team.team_name,
            amount: amount,
          }
          flow.push(flowItem);
          localStorage.setItem("currentBidTeam", JSON.stringify(flowItem));
          socket.emit('team_call' , JSON.stringify(flow[flow.length - 1]))
          InvokeTeamCall(flow[flow.length - 1])
          setBidFlow(flow);
          console.log("bidFlow== ", bidFlow);
        }
      }
    }

  };

  const InvokeTeamCall = (teamcallData: any) => {
    PlayerService().teamCall(teamcallData).then((response: any) => {

    })
  }


    const sellPlayer = () => {
    setIsLoading(true);
    if (currentBidTeam && currentBidTeam.id) {
      let params = {
        id: currentBidPlayer.id,
        team_id: currentBidTeam.id,
        bid_amount: bidAmount,
        team_name: currentBidTeam.team_name,
        player_name: currentBidPlayer.fullname
      };
      console.log("params== ", params);

      localStorage.setItem("selectedPlayer", JSON.stringify({}));
      PlayerService().sellPlayer(params).then((response: any) => {
        socket.emit('player_sold', JSON.stringify({id:currentBidPlayer.id, team_id:currentBidTeam.id, bid_amount:bidAmount}))
        console.log("response.data==", response.data);
        GetPlayer();
        GetAllTeams();
        setBidFlow([]);
        setBidAmount(0);
        setCurrentBidTeam({})
        if (response.data && response.data.player_count === TOTAL_PLAYER) {
          localStorage.setItem("team_complete",JSON.stringify(response.data))
          InvokeTeamComplete(response.data)
          setOpenPopUp(true);
          setPopUpContent(response.data);
        }
      })
    } else {
      setIsLoading(false);
      toast.warning("Please select a team and amount.");
    }

  }

  const InvokeTeamComplete = (teamData: any) => {
    PlayerService().teamComplete(teamData)
  }

  const InvokeClosePopup = () => {
    localStorage.setItem('close_popup', 'true');
    PlayerService().closePopup()
  }

  const handleBidChange = (event: ChangeEvent<HTMLInputElement>) => {
    setBidAmount(event.target.value ? parseInt(event.target.value) : 0);
  }

  const getUnsoldPlayers = () => {
    PlayerService().getUnsoldPlayers().then((response: any) => {
      console.log("response== ", response);
      if (response && response.data && response.data.length && response.data[0] > 0) {
        GetPlayer();
      } else {
        toast.success("Unsold players not found");
      }
    })
  }
  

    const setUnsoldPlayer = () => {
    setIsLoading(true);
    let params = {
      id: currentBidPlayer.id,
      un_sold: true
    }

    PlayerService().setUnsoldPlayer(params).then((response: any) => {
      socket.emit('player_unsold',  JSON.stringify({id:currentBidPlayer.id}))   
      console.log("response== ", response.data);
      GetPlayer();
    })
  }

    const handleBidBack = () => {
    let flow = bidFlow;
    flow.pop();
    console.log("flow=== ", flow);
    setBidFlow(flow);
    console.log("bidfloww== ", bidFlow);
    if (bidFlow && bidFlow.length > 0) {
      let currentTeam = bidFlow[bidFlow.length - 1];
      console.log("currentTeam== ", currentTeam);
      setCurrentBidTeam(currentTeam);
      setBidAmount(currentTeam.amount)
    }
    if (bidFlow.length === 0) {
      let currentTeam = {};
      setCurrentBidTeam(currentTeam);
      setBidAmount(0);
    }
  }



  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">



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


     

      {/* Player Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6">

        {isLoading && (

       <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
  <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center">

    <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>

    <p className="mt-4 text-lg font-semibold text-gray-700">
      Loading Player...
    </p>

  </div>
</div>

)}

        {currentBidPlayer && currentBidPlayer.id && (
        <div className="flex flex-col md:flex-row items-center gap-6">
          <img
            src={`https://storage.googleapis.com/rajas_pl/${currentBidPlayer.profile_image}`}
            alt={currentBidPlayer.fullname}
            className="w-40 h-40 md:w-52 md:h-52 rounded-xl object-cover border-4 border-blue-500"
          />

          <div className="text-center md:text-left">
            <h2 className="text-4xl font-bold text-green-600">
              {currentBidPlayer.id}.{currentBidPlayer.fullname}
            </h2>
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-green-600">
              Role : {currentBidPlayer.player_role}
            </h2>
          </div>
        </div>
        )}

        {/* Search and Action Buttons */}
<div className="mt-8 flex flex-col lg:flex-row gap-4">
  {/* Search */}
  <div className="flex w-full lg:flex-1 gap-2 sm:gap-3">
    <input
      type="text"
      placeholder="Id"
      value={searchText}
      onChange={handleInputChange}
      className="w-20 sm:w-24 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />

    <button
      onClick={GetPlayer}
      className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-5 py-2 sm:py-3 text-sm sm:text-base rounded-lg flex items-center justify-center gap-1.5 sm:gap-2"
    >
      <Search size={16} className="sm:w-[18px] sm:h-[18px]" />
      Search
    </button>
  </div>

  {/* Action Buttons */}
  <div className="grid grid-cols-2 lg:flex gap-2 sm:gap-3 w-full lg:w-auto">

    {/* Sell */}
    <button
      onClick={sellPlayer}
      className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-5 py-2 sm:py-3 text-sm sm:text-base rounded-lg flex items-center justify-center gap-1.5 sm:gap-2"
    >
      <BadgeDollarSign size={16} className="sm:w-[18px] sm:h-[18px]" />
      Sell
    </button>

    {/* Unsold */}
    <button
      onClick={setUnsoldPlayer}
      className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-5 py-2 sm:py-3 text-sm sm:text-base rounded-lg flex items-center justify-center gap-1.5 sm:gap-2"
    >
      <XCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
      Unsold
    </button>

    {/* Get Unsold Players */}
    <button
      onClick={getUnsoldPlayers}
      className="col-span-2 lg:col-span-1 bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-5 py-2 sm:py-3 text-sm sm:text-base rounded-lg flex items-center justify-center gap-1.5 sm:gap-2"
    >
      <RefreshCcw size={16} className="sm:w-[18px] sm:h-[18px]" />
      Get Unsold Players
    </button>

  </div>
</div>

        {/* Teams Section */}
        <div className="mt-10">
          <h3 className="text-2xl font-bold mb-5">Teams</h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {allTeams.map((team:any, index:any) => (
              <>
              { team.player_count !== TOTAL_PLAYER && 
              <div
                key={team.id}
                onClick={() => cardClick(team, index)}
                className="bg-gray-50 hover:bg-blue-50 border rounded-xl p-4 shadow-sm hover:shadow-lg transition cursor-pointer flex flex-col items-center"
              >
                <img
                  src={`https://storage.googleapis.com/rajas_pl/${team.team_logo}`}
                  alt={team.team_name}
                  className="w-20 h-20 object-contain mb-3"
                />

                <p className="text-center font-semibold text-gray-700">
                  {team.team_name}
                </p>

                {currentBidTeam && currentBidTeam.id === team.id && (
                <input
                value={bidAmount}
        type="text"
        placeholder="Bid Points"
        onChange={handleBidChange} 
        className="w-full border rounded-lg px-3 py-2 text-sm mb-2 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
               )}

      <p className="text-center font-semibold text-gray-700">
                  Max Bid: {team.max_bid_amount}
                </p>


                <p className="text-center font-semibold text-gray-700">
                  Total Points: {team.total_points}
                </p>
                <p className="text-center font-semibold text-gray-700">
                  Players : ({team.player_count}/{TOTAL_PLAYER})
                </p>

              </div>
              }
              </>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionPlayerPage;