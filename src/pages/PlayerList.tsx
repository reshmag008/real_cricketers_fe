import { Link, useNavigate } from 'react-router-dom';
import { Users, UserPlus, Trophy,Edit, Trash2, Download  } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PlayerCard from '@/components/PlayerCard';
import { usePlayer } from '@/context/PlayerContext';
import { useEffect, useState } from 'react';
import PlayerService from '@/service/PlayerService';
import playerCardImg from '../assets/playerCard.jpeg'
import soldPng from '../assets/sold.png'
import PDFCreator from './PDFCreator';
import TeamService from '@/service/TeamService';
import { useAuth } from "../context/AuthContext"; // adjust the path
import { toast } from 'sonner';
import { downloadPlayerImage } from "./playerImageGenerator";



const PlayerList = () => {
    const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

    const { players, setPlayers } = usePlayer();
  const [isLoading, setIsLoading] = useState(true)
    const [soldCount, setSoldCount] = useState(0);
    const [unSoldCount, setUnSoldCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [selectedTeamName, setSelectedTeamName] = useState('')
        const [selectedTeamId, setSelectedTeamId] = useState('')

    const [allTeams, setAllTeams] = useState<any>();
const [approvingPlayerId, setApprovingPlayerId] = useState<number | null>(null);



  useEffect(() => {
    console.log("isLoggedIn== ",isLoggedIn)
    GetAllPlayers();
    GetAllTeams();
  }, []);


    useEffect(() => {
  if (selectedTeamId) {
    setSelectedTeamId(selectedTeamId)
    console.log("Team selected:", selectedTeamId);
    GetAllPlayers();
  }
}, [selectedTeamId]);

  const GetAllTeams = () =>{
        TeamService().getAllTeams().then((response:any)=>{
            setAllTeams(response?.data)
        })
    }



  const capitalizeFirst = (str: any) => {
    if (!str) return "";
    str = str.toLowerCase();
    return str.charAt(0).toUpperCase() + str.slice(1);
  }


  const GetAllPlayers = async () => {
    setPlayers([]);
        setIsLoading(true);
        try {
            console.log("teamId==GetAllPlayers ",selectedTeamId)
            let params = {
                offset : 0,
                teamId : selectedTeamId
            }
            PlayerService().getAllPlayers(params).then((response:any)=>{
                setIsLoading(false);
                setPlayers(response?.data?.players);
                
                let playerList = response?.data?.players;
                
                setSoldCount(response?.data?.soldPlayerCount);
                setUnSoldCount(response?.data?.unSoldPlayerCount);
                setPendingCount(response?.data?.pendingPlayerCount);
                setIsLoading(false);
            })
        } catch (error) {
            setIsLoading(false);
            console.error('Error fetching players:', error);
        }
    };

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) =>{
        console.log("selectedItem-- ", event.target.value);
        setSelectedTeamId(event.target.value);
        allTeams.forEach((element:any) => {
            if(element.id ==  event.target.value){
                console.log("elem== ", element.team_name)
            setSelectedTeamName(element.team_name)
            }
        });
    }

    const handleEdit = (player:any)=>{

      navigate("/register", {
        state: {
          player
        },
      });

    }

     const handleDelete = (player)=>{
      
    }

    const handleDownload = (player)=>{
      downloadPlayerImage({
        player,
        playerBg :"../assets/playerCard.jpeg",
        soldImg : "../assets/sold.png",
        contentWidth:5,
        contentHeight:5,
        capitalizeFirst,
      })
    }


    const handleApprove = (playerId : any)=>{
      setApprovingPlayerId(playerId);
      PlayerService().approvePlayer(playerId).then((response:any)=>{
        console.log("response=== ", response)
        setApprovingPlayerId(null);

        let updatedPlayer = response.data;

        setPlayers((prev) =>
          prev.map((player) =>
            player.id === updatedPlayer.id
              ? { ...player, ...updatedPlayer }
              : player
          )
        );

        toast.success('Player approved successfully!');

      })
      
    }



  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="gradient-hero text-primary-foreground py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="text-center sm:text-left">
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl mb-1 sm:mb-2">
                Real Cricket League 2026 - Player Roster
              </h1>
              <p className="text-primary-foreground/80 text-sm sm:text-lg">
                {players ? players.length : 0} {players &&players.length === 1 ? 'player' : 'players'} registered for auction
              </p>
            </div>
             <Link to="/register" className="w-3/4 sm:w-auto">
              <Button className="w-full sm:w-auto h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-gold">
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Register New Player
              </Button>
            </Link> 
          </div>

          
          {/* <div className="flex flex-col sm:flex-row items-center sm:gap-6">

            {allTeams && allTeams.length>0 && (
                <select
              value={selectedTeamId}
              onChange={handleChange}
              className="
                w-full
                md:w-64
                px-4
                py-2
                rounded-lg
                gradient-hero
                text-white
                font-semibold
                border
                border-white/20
                shadow-lg
                focus:outline-none
                focus:ring-2
                focus:ring-white/50
                cursor-pointer
              "
            >
              <option value="" className="text-black bg-white">
                -- Select Team --
              </option>

              {allTeams?.map((team: any) => (
                <option
                  key={team.id}
                  value={team.id}
                  className="text-black bg-white"
                >
                  {team.team_name}
                </option>
              ))}
            </select>

            )}


                  <PDFCreator playerList={players} teamName={selectedTeamName}/>

      </div>*/}


        </div>
      </section>

      {/* Player Grid */}
      <section className="container mx-auto px-4 py-6 sm:py-10">

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center animate-fade-in">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-muted flex items-center justify-center mb-4 sm:mb-6">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/50" />
            </div>
            <h2 className="font-heading font-bold text-xl sm:text-2xl text-foreground mb-2">
              Loading Registered Players...
            </h2>
            <div className="flex justify-center ">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          </div>
        )}

        {!isLoading && players && players.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center animate-fade-in">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-muted flex items-center justify-center mb-4 sm:mb-6">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/50" />
            </div>
            <h2 className="font-heading font-bold text-xl sm:text-2xl text-foreground mb-2">
              No Players Yet
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-4 sm:mb-6 max-w-md px-4">
              Start building your dream team by registering your first player for the auction.
            </p>
             <Link to="/register">
              <Button className="h-10 sm:h-12 px-6 sm:px-8 text-sm sm:text-base font-semibold gradient-pitch hover:opacity-90">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Register First Player
              </Button>
            </Link> 
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {players && players.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>


//       <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">

        

//   {players && players.map((player) => (
//     <div key={player.id} className="relative group">
//   <img
//     src={playerCardImg}
//     alt="img"
//     className="w-full h-full object-cover"
//   />

  

//   {/* Admin Overlay */}
//   {isLoggedIn && player.status==1 && (
//     <div className="absolute top-3 right-3 z-30 flex items-center gap-3 rounded-lg bg-black/75 p-2 backdrop-blur-sm shadow-lg">
//       {/* Payment Screenshot */}
//       {player.payment_screenshot ? (
//         <a
//           href={`https://storage.googleapis.com/rajas_pl/${player.payment_screenshot}`}
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <img
//             src={`https://storage.googleapis.com/rajas_pl/${player.payment_screenshot}`}
//             alt="Payment Screenshot"
//             className="h-16 w-12 rounded border border-white object-cover hover:scale-105 transition-transform"
//           />
//         </a>
//       ) : (
//         <div className="flex h-16 w-12 items-center justify-center rounded border border-dashed border-gray-400 text-[10px] text-white">
//           No Image
//         </div>
//       )}

//       {/* Approve Button */}
//       { approvingPlayerId === player.id  ? (
//   <div className="flex items-center justify-center rounded-md bg-green-600 px-3 py-2">
//     <svg
//       className="h-4 w-4 animate-spin text-white"
//       xmlns="http://www.w3.org/2000/svg"
//       fill="none"
//       viewBox="0 0 24 24"
//     >
//       <circle
//         className="opacity-25"
//         cx="12"
//         cy="12"
//         r="10"
//         stroke="currentColor"
//         strokeWidth="4"
//       />
//       <path
//         className="opacity-75"
//         fill="currentColor"
//         d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
//       />
//     </svg>
//   </div>
// ) : (
//   <button
//     onClick={() => handleApprove(player.id)}
//     className="rounded-md bg-green-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-700"
//   >
//     Approve
//   </button>
// )}

//     </div>
//   )}

//   {/* Existing content */}
//   <div className="absolute top-[43.3%] left-[4.8%] text-right text-white font-bold text-lg">
//     <img
//       src={`https://storage.googleapis.com/rajas_pl/${player.profile_image}`}
//       alt="img"
//       className="w-[37.5%] aspect-[1/1.56] object-cover rounded-[4%]"
//     />
//   </div>


//   {/* {!player.bid_amount && (
//   <div
//     className="
//       absolute top-[20%] right-[4%] z-20
//       flex items-center gap-3
//       rounded-full
//       border border-emerald-400/60
//       bg-slate-950/90
//       px-3 py-1.5
//       shadow-[0_0_15px_rgba(52,211,153,0.3)]
//       backdrop-blur-sm
//     "
//   >
//     <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-black uppercase text-slate-950">
//       SOLD
//     </span>

//     <span className="text-xs font-bold text-white">
//       Team Name
//     </span>

//     <span className="text-sm font-black text-yellow-400">
//       ₹1,000
//     </span>
//   </div>
// )} */}


//       <div className="absolute bottom-[20%] left-[50%] w-[13%] text-left text-green font-bold text-[30px]">
//         {player.id}
//       </div>

//       <div
//         className="absolute bottom-[14%] left-[1%] w-[45%] text-center font-bold text-[80%] text-black">
//         {player.fullname.toUpperCase()}
//       </div>

//       <div className="absolute bottom-[9.2%] left-[48%] text-left text-black font-bold text-[65%]">
//         {player.player_role}
//       </div>

//       <div className="absolute bottom-[7.2%] left-[48%] text-left text-black font-bold text-[65%]">
//         {player.batting_style}
//       </div>

//       <div className="absolute bottom-[4.8%] left-[48%] text-left text-black font-bold text-[65%]">
//         {player.bowling_style}
//       </div>

//       <div className="absolute bottom-[2.7%] left-[48%] text-left text-black font-bold text-[65%]">
//         {capitalizeFirst(player?.location)}
//       </div>

//       <div className="absolute bottom-[0.2%] left-[48%] text-left text-black font-bold gap-2">
//         <span className="text-black font-bold text-[65%]">
//           {player.contact_no}
//         </span>

//         {player.status ==1  && (
//           <span className="ml-2 rounded-full bg-yellow-500 px-2 py-0.5 text-[50%] font-bold text-white shadow-sm">
//             Pending
//           </span>
          
//         )}
//       </div>

      

      
//      {/* {isLogin && ( */}
//      <div className="absolute top-3 left-[15%] right-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3 px-4">
//     {/* <button
//       onClick={() => handleEdit(player)}
//       className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
//     >
//       <Edit className="w-4 h-4" />
//     </button> */}

//     {/* <button
//       onClick={() => handleDelete(player.id)}
//       className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 transition-colors"
//     >
//       <Trash2 className="w-4 h-4" />
//     </button> */}
//     {/* <button
//       onClick={() => handleDownload(player)}
//       className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 transition-colors"
//     >
//       <Download className="w-4 h-4" />
//     </button> */}

//   </div>
//   {/* )} */}

// </div>
//   ))}
// </div>

        )}
      </section>
    </div>
  );
};

export default PlayerList;
