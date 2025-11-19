import React, {createContext, useContext, useState, useEffect} from 'react';
import {User} from '../types';

interface AuthContextType{
    isLoggedIn: boolean;
    user: User | null;
    token: string | null;
    login: (token: string, user: User ) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('authUser');    
        if(storedToken && storedUser){
           try{
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } catch (error){
                console.error('Failed to parse stored user:', error);
                localStorage.clear();
           }
        }
    }, []);
    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('authToken', newToken);
        localStorage.setItem('authUser', JSON.stringify(newUser));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
    };

    const isLoggedIn = !!token;

    return (
        <AuthContext.Provider value={{isLoggedIn, user, token, login, logout}}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () =>{
    const context = useContext(AuthContext);
    if(context === undefined){
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}