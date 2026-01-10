import { createContext, useState } from "react";

export const LogInContext = createContext(null);

export const LogInContextProvider = (props) => {
  const [user, setUser] = useState(null);        // Google user info
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [trip, setTrip] = useState([]);

  // save user after login
  const saveUser = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  // logout function
  const logoutUser = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("user");
  };

  return (
    <LogInContext.Provider value={{
      user,
      isAuthenticated,
      saveUser,
      logoutUser,
      trip,
      setTrip
    }}>
      {props.children}
    </LogInContext.Provider>
  )
}
