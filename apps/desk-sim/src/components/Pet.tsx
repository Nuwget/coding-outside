import React from "react";
import { PetSpecies } from "@coding-outside/protocol";

interface PetProps {
  species: PetSpecies;
}

const PET_SPRITES: Record<PetSpecies, string> = {
  capybara: "🦫",
  bear: "🐻",
  cat: "🐱",
  dog: "🐶",
  fox: "🦊",
};

export const Pet: React.FC<PetProps> = ({ species }) => {
  const sprite = PET_SPRITES[species];
  return (
    <div className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-desert-surface border border-desert-surface/60 h-full">
      <div className="text-3xl select-none">{sprite}</div>
      <div className="text-[8px] text-desert-idle/70 uppercase tracking-wider">
        modo pet
      </div>
      <div className="text-[10px] text-desert-idle">22:14 · 68% 5h</div>
    </div>
  );
};
