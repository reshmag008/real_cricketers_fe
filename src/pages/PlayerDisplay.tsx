import React, {  useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { BACKEND_URL, TOTAL_PLAYER, roomId } from "../constants";
import playerSvg from "../assets/account-icon.png";
import bellGif from '../assets/bell.gif';
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import congratsJif from '../assets/congratulations.gif';
import clapJif from '../assets/clap.gif'
import playerBg from '../assets/player_display.jpeg'
import TeamTable from "./TeamTable";
import CelebrationPopup from "./celebrationPopup";
import PlayerService from "@/service/PlayerService";
import { Trophy, Users, UserX } from "lucide-react";
import bklogo from '../assets/bk_logo.jpeg'
import AuctionLoader from "./AuctionLoader";


const PlayerDisplay: React.FC = () => {
  const [socket, setSocket] = useState<any>(null);
  const [currentBidPlayer, setCurrentPlayer] = useState<any>({});
  const [currentCall, setCurrentCall] = useState<any>({});
  const [soldPlayer, setSoldPlayer] = useState<any>({});
  const [allSoldPlayers, setAllSoldPlayer] = useState<any>([])
  const [popUpContent, setPopUpContent] = useState<any>({})
  const [openPopUp, setOpenPopUp] = useState(false);
  const [allTeams, setAllTeams] = useState<any>([])
    const [showTeams, setShowTeam] = useState(false);

      const [soldCount, setSoldCount] = useState(0);
    const [unSoldCount, setUnSoldCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);

  const isMobile = window.matchMedia("(max-width: 600px)").matches;
  const [player, setPlayer] = useState<any | null>(null);
  


useEffect(() => {
  const loadPlayer = () => {
    const currentBidding = JSON.parse(localStorage.getItem("currentBidTeam") || "{}");
    console.log("currentBidding== ", currentBidding)
    setCurrentCall(currentBidding)
    const data = localStorage.getItem("selectedPlayer");
    const teamComp: any = JSON.parse(localStorage.getItem("team_complete") || "{}");
    let close_popup = localStorage.getItem('close_popup');
    console.log("close_popup= ", close_popup)
    if(close_popup == 'true'){
      setOpenPopUp(false);
      setPopUpContent(null);
    }
    if(teamComp?.id) {
      setOpenPopUp(true);
      setPopUpContent(teamComp);
    }
    console.log("teamComp== ", teamComp)
    GetAllTeams();
    GetAllPlayers();
    getSoldPlayers();
    if (!data || data === "undefined") {
      setPlayer(null);
      return;
    }
     
    try {
      setPlayer(JSON.parse(data));
      setCurrentPlayer(JSON.parse(data))
    } catch {
      setPlayer(null);
    }
  };

  // Load initially
  loadPlayer();

  // Listen for changes
  window.addEventListener("storage", loadPlayer);

  return () => {
    window.removeEventListener("storage", loadPlayer);
  };
}, []);


  const GetAllTeams = () => {
    try {
      PlayerService()
        .getAllTeams()
        .then((response: any) => {
          setAllTeams(response?.data);
          setShowTeam(true);
        });
    } catch (error) {
      console.error("Error fetching players:", error);
    }
  };



    const GetAllPlayers = async () => {
          try {
              let teamId = null;
              console.log("teamId==GetAllPlayers ",teamId)
              let params = {
                  offset : 0,
                  teamId : teamId
              }
              PlayerService().getAllPlayers(params).then((response:any)=>{
                  
                  let playerList = response?.data?.players;
                  
                  setSoldCount(response?.data?.soldPlayerCount);
                  setUnSoldCount(response?.data?.unSoldPlayerCount);
                  setPendingCount(response?.data?.pendingPlayerCount);
              })
          } catch (error) {
              console.error('Error fetching players:', error);
          }
      };

   const capitalizeFirst = (str: any) => {
    if (!str) return "";
    str = str.toLowerCase();
    return str.charAt(0).toUpperCase() + str.slice(1);
  }



  const getSoldPlayers = () =>{

    PlayerService().getSoldPlayers().then((response:any)=>{
        setAllSoldPlayer(response?.data?.players);
    })
  }


  return (
    <div
      className="h-screen bg-slate-950 text-white flex flex-col overflow-hidden"
    >

      {openPopUp && 
      <CelebrationPopup
          open={openPopUp}
          data={popUpContent}
          onClose={() => setOpenPopUp(false)}
        />
      }
      {/* ================= HEADER ================= */}

      <header className="flex-shrink-0 bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 border-b border-slate-700">

  <div className="grid grid-cols-3 gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-3">

    {/* Sold */}
    <div className="bg-white/10 rounded-lg p-2 md:p-3 text-center flex items-center justify-center gap-2">

      <Users className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />

      <div>
        <p className="text-xl md:text-base font-black uppercase tracking-wider text-cyan-300 ">
  Sold
</p>

        <p className="text-xl md:text-3xl font-bold leading-none">
          {soldCount}
        </p>
      </div>

    </div>


    {/* Pending */}
    <div className="bg-white/10 rounded-lg p-2 md:p-3 text-center flex items-center justify-center gap-2">

      <Trophy className="w-5 h-5 md:w-6 md:h-6 text-green-400" />

      <div>
        <p className="text-sm md:text-base font-black uppercase tracking-wider text-cyan-300 ">
          Pending
        </p>

        <p className="text-xl md:text-3xl font-bold leading-none">
          {pendingCount}
        </p>
      </div>

    </div>


    {/* Unsold */}
    <div className="bg-white/10 rounded-lg p-2 md:p-3 text-center flex items-center justify-center gap-2">

      <UserX className="w-5 h-5 md:w-6 md:h-6 text-red-400" />

      <div>
        <p className="text-sm md:text-base font-black uppercase tracking-wider text-cyan-300 ">
          Unsold
        </p>

        <p className="text-xl md:text-3xl font-bold leading-none">
          {unSoldCount}
        </p>
      </div>

    </div>

  </div>

</header>

      {/* ================= BODY ================= */}

      <main className="flex-1 min-h-0 bg-slate-950">

  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 h-full">

    {/* ===================================================== */}
    {/* PLAYER PROFILE */}
    {/* ===================================================== */}


    {!currentBidPlayer?.id ? (

      <AuctionLoader />


      
    ):(

    <section
      className="
        order-1 lg:order-2 lg:col-span-3
        rounded-2xl
        border-2 border-cyan-500/40
        bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950
        shadow-[0_0_35px_rgba(34,211,238,0.12)]
        flex flex-col
      "
    >

      {/* ================= LEAGUE HEADER ================= */}

      <div
        className="
          border-b-2 border-cyan-500/30
          bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950
          px-6 py-4
        "
      >

        <div className="flex items-center justify-between gap-5">

          <div>

            <p className="text-sm font-black uppercase tracking-[0.3em] text-cyan-400">
              🏏 LIVE AUCTION
            </p>

            <h2 className="mt-1 text-2xl lg:text-3xl xl:text-4xl font-black text-white tracking-wide">
              Real Cricket League 2026
            </h2>

          </div>

          {/* LIVE */}
          <div
            className="
              shrink-0 flex items-center gap-3
              rounded-full
              border-2 border-red-400/50
              bg-red-500/10
              px-5 py-2
              shadow-[0_0_20px_rgba(239,68,68,0.15)]
            "
          >

            <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />

            <span className="text-base lg:text-lg font-black text-red-400">
              LIVE
            </span>

          </div>

        </div>

      </div>


      {/* ================= PLAYER CONTENT ================= */}

      <div className="p-5 lg:p-6">

        <div className="grid lg:grid-cols-12 gap-6 items-center">

          {/* ================= PLAYER IMAGE ================= */}

          <div className="lg:col-span-5 flex justify-center">
            

            <div className="relative w-full max-w-sm">

              {/* Glow */}
              <div
                className="
                  absolute -inset-2
                  rounded-2xl
                  bg-gradient-to-r
                  opacity-40
                  blur-xl
                "
              />

              <div
                className="
                  relative
                  overflow-hidden
                  rounded-2xl
                  border-2 border-cyan-400/60
                  bg-slate-900
                  shadow-[0_0_30px_rgba(34,211,238,0.15)]
                "
              >

              <img
                src={`https://storage.googleapis.com/rajas_pl/${currentBidPlayer.profile_image}`}
                alt={currentBidPlayer.fullname}
                className="block w-full aspect-[3/5] object-cover"
              />

                

              </div>

            </div>

          </div>


          {/* ================= PLAYER DETAILS ================= */}

          <div className="lg:col-span-7">

            {/* Player Heading */}

            <div className="mb-5">

              <p className="text-base font-black uppercase tracking-[0.3em] text-cyan-400">
                ⚡ UP FOR BIDDING
              </p>

              <h1
                className="
                  mt-1
                  text-5xl
                  lg:text-6xl
                  xl:text-7xl
                  font-black
                  uppercase
                  leading-none
                  text-white
                  drop-shadow-[0_0_12px_rgba(255,255,255,0.08)]
                "
              >
                #{currentBidPlayer.id}.{currentBidPlayer.fullname}
              </h1>

            </div>


            {/* ================= PLAYER INFO ================= */}

            <div className="grid grid-cols-2 gap-3">

              {/* Role */}

              <div
                className="
                  rounded-xl
                  border border-cyan-500/30
                  bg-cyan-500/5
                  px-4 py-3
                "
              >

                <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                  ROLE
                </p>

                <p className="mt-1 text-xl lg:text-2xl font-black text-white">
                  {currentBidPlayer.player_role}
                </p>

              </div>


              {/* Batting */}

              <div
                className="
                  rounded-xl
                  border border-violet-500/30
                  bg-violet-500/5
                  px-4 py-3
                "
              >

                <p className="text-xs font-bold uppercase tracking-widest text-violet-400">
                  BATTING
                </p>

                <p className="mt-1 text-xl lg:text-2xl font-black text-white">
                  {currentBidPlayer.batting_style}
                </p>

              </div>


              {/* Bowling */}

              <div
                className="
                  rounded-xl
                  border border-blue-500/30
                  bg-blue-500/5
                  px-4 py-3
                "
              >

                <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
                  BOWLING
                </p>

                <p className="mt-1 text-xl lg:text-2xl font-black text-white">
                  {currentBidPlayer.bowling_style}
                </p>

              </div>


              {/* Location */}

              <div
                className="
                  rounded-xl
                  border border-pink-500/30
                  bg-pink-500/5
                  px-4 py-3
                "
              >

                <p className="text-xs font-bold uppercase tracking-widest text-pink-400">
                  LOCATION
                </p>

                <p className="mt-1 text-xl lg:text-2xl font-black text-white">
                  {currentBidPlayer.location}
                </p>

              </div>

            </div>


            {/* ================= CONTACT ================= */}

            <div
              className="
                mt-3
                flex items-center justify-between
                rounded-xl
                border border-emerald-500/30
                bg-emerald-500/5
                px-4 py-3
              "
            >

              <div>

                <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  CONTACT
                </p>

                <p className="text-xl lg:text-2xl font-black text-emerald-300">
                  {currentBidPlayer.contact_no}
                </p>

              </div>

            </div>


            {/* ================================================= */}
            {/* CURRENT BID */}
            {/* ================================================= */}

            <div
              className="
                mt-4
                rounded-2xl
                border-2 border-yellow-400/50
                bg-gradient-to-r
                from-yellow-400/10
                via-orange-400/5
                to-transparent
                px-5 py-4
                shadow-[0_0_25px_rgba(250,204,21,0.08)]
              "
            >

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm font-bold uppercase tracking-[0.25em] text-yellow-300">
                    CURRENT HIGHEST BID
                  </p>

                  <p
                    className="
                      mt-1
                      text-5xl
                      lg:text-6xl
                      xl:text-7xl
                      font-black
                      leading-none
                      text-yellow-400
                    "
                  >
                    {currentCall.amount}
                  </p>

                </div>


                <div className="text-right">

                  {/* <p className="text-sm uppercase tracking-widest text-slate-400">
                    STATUS
                  </p> */}

                  <p className="mt-1 text-xl lg:text-2xl font-black text-emerald-400">
                    {currentCall.team_name}
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </section>

    )}


    {/* ===================================================== */}
    {/* TEAM LIST */}
    {/* ===================================================== */}

   
<aside
  className="
    hidden lg:flex
    order-2 lg:order-1 lg:col-span-1
    min-h-0
    rounded-2xl
    border-2 border-violet-500/40
    bg-gradient-to-b from-indigo-950 to-slate-950
    flex-col
    overflow-hidden
    shadow-[0_0_30px_rgba(139,92,246,0.12)]
  "
>

  {/* Team Header */}
 <div
  className="
    shrink-0
    border-b border-violet-500/30
    bg-violet-500/10
    px-4 py-1.5
  "
>
  <h4 className="text-lg lg:text-xl font-black text-white leading-none">
    TEAMS
  </h4>
</div>


  {/* Scrollable Team List */}
  <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">

    {allTeams.map((team, index) => (

      <div
        key={team.id}
        className="
          rounded-xl
          border border-violet-500/25
          bg-slate-900/90
          px-4 py-3
          shadow-md
          transition-all
          hover:border-cyan-400
          hover:bg-cyan-500/10
        "
      >

        <div className="flex items-center justify-between gap-2">

          <div className="flex items-center gap-3 min-w-0">

            <span
              className="
                flex h-8 w-8 shrink-0
                items-center justify-center
                rounded-full
                bg-gradient-to-br
                from-cyan-400
                to-violet-500
                text-sm font-black
                text-slate-950
              "
            >
              {index + 1}
            </span>

            <span className="text-base lg:text-lg font-black text-white truncate">
              {team.team_name}
            </span>

          </div>

          <span className="shrink-0 text-sm lg:text-base font-black text-cyan-400">
            {team.player_count}
          </span>

        </div>

        <div className="mt-2 flex items-center justify-between border-t border-slate-700 pt-2">

          <span className="text-xs uppercase tracking-wider text-slate-500">
            Points
          </span>

          <span className="text-base lg:text-lg font-black text-yellow-400">
            {team.max_bid_amount} / {team.total_points}
          </span>

        </div>

      </div>

    ))}

  </div>

</aside>

  </div>

</main>
    </div>
  );
}

export default PlayerDisplay;