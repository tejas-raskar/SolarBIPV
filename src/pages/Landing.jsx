import { Hero } from "../components/Hero";

export const Landing = () => {
  return (
    <div>
      <div className="absolute flex justify-end w-full z-10">
        <div className="flex justify-between gap-4 pr-10 mt-5 text-[#291C18] underline font-poppins text-sm">
          <a className="hover:text-[#EBDB88] ">How it works?</a>
          <a
            href="https://github.com/tejas-raskar/solarbipv"
            target="_blank"
            className="hover:text-[#EBDB88] "
          >
            Github
          </a>
        </div>
      </div>
      <Hero />
    </div>
  );
};
