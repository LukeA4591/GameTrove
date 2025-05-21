import React from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";
import Home from './pages/home';
import { AuthProvider } from "./contexts/auth-context"
import { LoginPage } from "./pages/login-page"
import { RegisterPage } from "./pages/register-page"
import { GameDetailsPage } from "./pages/game-details-page"
import { CreateGamePage } from "./pages/create-game-page"
import { ProtectedRoute } from "./components/protected-route"
import { EditGamePage } from "./pages/edit-game-page"
import { MyGamesPage } from "./pages/my-games-page"
import { ProfilePage } from "./pages/profile-page"
import { EditProfilePage } from "./pages/edit-profile-page"

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/games/:gameId" element={<GameDetailsPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                    <Route
                        path="/create-game"
                        element={
                            <ProtectedRoute>
                                <CreateGamePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/games/:gameId/edit"
                        element={
                            <ProtectedRoute>
                                <EditGamePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/my-games"
                        element={
                            <ProtectedRoute>
                                <MyGamesPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <ProfilePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/edit-profile"
                        element={
                            <ProtectedRoute>
                                <EditProfilePage />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
