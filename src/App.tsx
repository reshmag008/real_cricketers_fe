import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import { PlayerProvider } from "@/context/PlayerContext";
import Header from "@/components/ui/Header";

import Index from "./pages/Index";
import PlayerRegister from "./pages/PlayerRegister";
import NotFound from "./pages/NotFound";
import PlayerList from "./pages/PlayerList";
import TeamList from "./pages/TeamList";
import TeamRegistration from "./pages/TeamRegister";
import Login from "./pages/Login";
import LiveAuctionPlayerCard from "./pages/Auction";
import AuctionPlayerPage from "./pages/AuctionControlCenter";
import PlayerDisplay from "./pages/PlayerDisplay";
import PlayerAuctionView from "./pages/LiveAuction";
import LiveAuctionTeam from "./pages/teamOwnerAuction";
import JoinAuction from "./pages/JoinAuction";
import AuctioneerLive from "./pages/AuctioneerLive";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();

  // Hide header on live auction page
  // const hideHeader = location.pathname === "/player-display";

  const headerHiddenRoutes = [
  "/player-display",
  "/auctioneer_live",
  "/team_owner_auction",
  "/join_auction"
];

const hideHeader = headerHiddenRoutes.includes(location.pathname);


  return (
    <div className="min-h-screen bg-background">
      {!hideHeader && <Header />}

      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<PlayerRegister />} />
        <Route path="/players" element={<PlayerList />} />
        <Route path="/auction" element={<LiveAuctionPlayerCard />} />
        <Route path="/control-center" element={<AuctionPlayerPage />} />
        <Route path="/player-display" element={<PlayerDisplay />} />
        <Route path="/team-register" element={<TeamRegistration />} />
        <Route path="/teams" element={<TeamList />} />
        <Route path="/auction-live" element={<PlayerAuctionView />} />
        <Route path="*" element={<NotFound />} />
        {/* <Route path="/team_owner_auction" element={<LiveAuctionTeam />} /> */}
        {/* <Route path="/join_auction" element={<JoinAuction />} /> */}
        {/* <Route path="/auctioneer_live" element={<AuctioneerLive />} /> */}
      </Routes>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PlayerProvider>
        <Toaster />
        <Sonner position="top-center" richColors />

        <BrowserRouter>
          <AppContent />
        </BrowserRouter>

      </PlayerProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;