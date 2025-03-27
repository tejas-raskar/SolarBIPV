import { motion } from "motion/react";
export const Hero = () => {
  return (
    <div>
      <video
        autoPlay
        muted
        disablePictureInPicture
        className="h-dvh w-dvw object-cover brightness-105"
      >
        <source src="/assets/city.mp4" type="video/mp4" />
      </video>
      <div className="absolute top-1/6 left-0 flex flex-col w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, delay: 3 }}
          className="mx-auto font-poppins text-[5rem] font-semibold text-[#291C18]"
        >
          SolarBIPV
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 4 }}
          className="max-w-lg -mt-2 text-[#291C18] text-balance text-center text-base mx-auto font-poppins"
        >
          Find out where to install solar panels for maximum energy generation
        </motion.div>
      </div>
    </div>
  );
};
