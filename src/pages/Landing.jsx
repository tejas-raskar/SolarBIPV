import { Hero } from "../components/Hero";
import { motion } from "motion/react";
export const Landing = () => {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 4 }}
        className="absolute flex justify-end w-full z-10"
      >
        <div className="flex justify-between gap-4 pr-10 mt-5 text-[#291C18] underline font-poppins text-base">
          <a
            href="https://github.com/tejas-raskar/solarbipv"
            target="_blank"
            className="hover:text-[#EBDB88] pt-2"
          >
            Github
          </a>
          <a href="/how-it-works" className="hover:text-[#EBDB88] pt-2">
            How it works?
          </a>
          <a
            href="/model"
            className="bg-[#EBDB88] no-underline p-2 px-4 rounded-full font-semibold"
          >
            Try it
          </a>
        </div>
      </motion.div>
      <Hero />
    </div>
  );
};
