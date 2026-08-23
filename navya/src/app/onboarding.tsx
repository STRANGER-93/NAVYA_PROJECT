import React, { useState } from "react";

import { useRouter } from "expo-router";

import OnboardingCard from "../components/OnboardingCard";

import { onboardingData } from "../constants/onboardingData";

export default function OnboardingScreen() {

  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(0);

  const handleNext = () => {

    if (currentPage < onboardingData.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      router.replace("/login");
    }

  };

  const handleSkip = () => {

    router.replace("/login");

  };

  const handleLogin = () => {

    router.replace("/login");

  };

  return (
    <OnboardingCard
      item={onboardingData[currentPage]}
      currentIndex={currentPage}
      totalPages={onboardingData.length}
      onNext={handleNext}
      onSkip={handleSkip}
      onLogin={handleLogin}
    />
  );
}