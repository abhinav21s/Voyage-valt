import React, { useContext } from "react";
import { Button } from "../ui/button.jsx";
import { LogInContext } from "@/Context/LogInContext/Login.jsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { LogInIcon, LogOutIcon, Plane, Plus, User } from "lucide-react";
import { Link } from "react-router-dom";
import ThemeToggle from "../constants/ThemeToggle.jsx";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";

function Header({ headerRef }) {
  const { user, isAuthenticated, saveUser, logoutUser } = useContext(LogInContext);

  // Google login handler
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenInfo) => {
      const resp = await axios.get(
        `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenInfo.access_token}`,
        {
          headers: {
            Authorization: `Bearer ${tokenInfo.access_token}`,
            Accept: "application/json",
          },
        }
      );

      saveUser(resp.data);
    },
    onError: (err) => {
      console.error("Google Login Failed:", err);
    },
  });

  return (
    <div
      ref={headerRef}
      className="w-full flex items-center justify-between shadow-sm p-3 md:px-40 border-b"
    >
      <Link to={"/"}>
        <div className="logo flex gap-2 items-center justify-between">
          <div className="img inline-block h-5 w-5 md:h-10 md:w-10">
            <img src="/logo.png" alt="" />
          </div>
          <h1 className="text-lg md:text-3xl font-bold bg-gradient-to-b from-blue-400 to-blue-700 bg-clip-text text-transparent">
            VoyageValt
          </h1>
        </div>
      </Link>

      <div className="flex items-center justify-center gap-5">
        <ThemeToggle />

        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="user flex items-center gap-2 mr-3">
                <h2 className="hidden sm:block text-lg md:text-xl bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent capitalize">
                  Hi {user.given_name || user.name}
                </h2>
                <div className="userimg overflow-hidden h-10 w-10 rounded-full">
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} />
                  ) : (
                    <User />
                  )}
                </div>
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="text-center sm:text-left w-56">
              <DropdownMenuLabel className="font-semibold text-xl flex items-center justify-start gap-2">
                <User /> My Account
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <Link to="/all-trips">
                <DropdownMenuItem className="w-full cursor-pointer text-lg flex items-center justify-start gap-2">
                  <Plane /> My Trips
                </DropdownMenuItem>
              </Link>

              <Link to="/plan-a-trip">
                <DropdownMenuItem className="w-full cursor-pointer text-lg flex items-center justify-start gap-2">
                  <Plus /> Create Trip
                </DropdownMenuItem>
              </Link>

              <DropdownMenuSeparator />

              <div className="text-lg flex items-center justify-center p-2">
                <Button
                  variant="destructive"
                  className="w-full text-center"
                  onClick={logoutUser}
                >
                  Log Out <LogOutIcon className="h-4" />
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={() => googleLogin()}>
            Sign In{" "}
            <DropdownMenuShortcut>
              <LogInIcon className="h-4" />
            </DropdownMenuShortcut>
          </Button>
        )}
      </div>
    </div>
  );
}

export default Header;
