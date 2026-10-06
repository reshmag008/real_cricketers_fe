import React, { useEffect, useState } from 'react';
import TeamService from '@/service/TeamService';
import { Link } from 'react-router-dom';
import { Users, UserPlus, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TeamList: React.FC = () => {

    const [allTeams, setAllTeams] = useState<any>([])
const [isLoading, setIsLoading] = useState(true);
    useEffect(()=>{
        GetAllTeams();
    },[])

    const GetAllTeams = () =>{
        TeamService().getAllTeams().then((response:any)=>{
            setAllTeams(response?.data)
            setIsLoading(false)
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
               Real Cricket League 2026
              </h1>
              <p className="text-primary-foreground/80 text-sm sm:text-lg">
                {allTeams ? allTeams.length : 0} {allTeams &&allTeams.length === 1 ? 'team' : 'teams'} registered for auction
              </p>
            </div>
             <Link to="/team-register" className="w-3/4 sm:w-auto">
              <Button className="w-full sm:w-auto h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-gold">
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Register Teams
              </Button>
            </Link> 
          </div>

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
              Loading Registered Teams...
            </h2>
            <div className="flex justify-center ">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          </div>
        )}

        {!isLoading && allTeams && allTeams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center animate-fade-in">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-muted flex items-center justify-center mb-4 sm:mb-6">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/50" />
            </div>
            <h2 className="font-heading font-bold text-xl sm:text-2xl text-foreground mb-2">
              No Teams Yet
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-4 sm:mb-6 max-w-md px-4">
              Start building your dream team by registering your first team for the auction.
            </p>
             <Link to="/team-register">
              <Button className="h-10 sm:h-12 px-6 sm:px-8 text-sm sm:text-base font-semibold gradient-pitch hover:opacity-90">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Register Team
              </Button>
            </Link> 
          </div>
        ) : (
          
      <div className="max-w-7xl mx-auto px-5 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {allTeams.map((team) => (
            <div
              key={team.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition duration-300 overflow-hidden group"
            >
              {/* Card Header */}
              <div className="gradient-hero h-2"></div>

              {/* Logo */}
              <div className="flex justify-center mt-6">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
                  <img
                  src={`https://storage.googleapis.com/rajas_pl/${team.team_logo}`}
                    alt={team.team_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                  />
                </div>
              </div>

              {/* Name */}
              <div className="p-5 text-center">
                <h2 className="text-lg font-bold text-gray-800">
                  {team.team_name}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Team #{team.id}
                </p>
              </div>
            </div>
          ))}
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center animate-fade-in">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-muted flex items-center justify-center mb-4 sm:mb-6">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/50" />
            </div>
            <h2 className="font-heading font-bold text-xl sm:text-2xl text-foreground mb-2">
              Loading Registered Teams...
            </h2>
            <div className="flex justify-center ">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && allTeams.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
            <Users
              size={70}
              className="mx-auto text-gray-300 mb-4"
            />
            <h2 className="text-2xl font-semibold text-gray-700">
              No Teams Found
            </h2>
            <p className="text-gray-500 mt-2">
              Register a team to see it here.
            </p>
          </div>
        )}
      </div>

        )}
      </section>
    </div>
  );
};

export default TeamList;
