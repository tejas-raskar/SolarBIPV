import overview from "/assets/overview.svg";
import azimuthAltitude from "/assets/Azimut_altitude.svg";
import "katex/dist/katex.min.css";
import { BlockMath, InlineMath } from "react-katex";
import { useNavigate } from "react-router-dom";

export const Docs = () => {
  const radius = "r"; // Or a number if you want to display a specific value
  const altitude = "\\alpha"; // Use alpha for altitude
  const azimuth = "\\beta"; // Use beta for azimuth
  const navigate = useNavigate();
  return (
    <div className="font-poppins text-white mx-10 md:mx-auto mt-20 pb-50 max-w-3xl">
      <button
        onClick={() => navigate("/")}
        className="text-gray-500 hover:text-white cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-arrow-left-icon lucide-arrow-left"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
      </button>
      <div className="text-4xl mt-6 mb-2">How it works?</div>
      <hr />
      <div className="mt-10">
        SolarBIPV helps you to maximise the solar energy generation by
        identifying the best locations for BIPV installations. The tool uses 3D
        city models to simulate real-time shadows and consider its impact in the
        calculation of the surface's solar energy potential.
      </div>
      <div className="mt-10">
        <div className="text-2xl">What is BIPV?</div>
        <div className="mt-2">
          Building-Integrated PhotoVoltaics (BIPV) are materials that integrate
          solar cells directly into building materials. Instead of simply
          attaching solar panels to a building, BIPV replaces the traditional
          materials like roofing tiles, facade panels, or windows with
          energy-generated alternatives. This allows building to generate their
          own electricity while maintating their structural integrity and
          aesthetic appeal.
        </div>
      </div>
      <div className="mt-10">
        <div className="text-2xl">Calculating solar energy potential</div>
        <img
          src={overview}
          alt="Flow of program"
          className="px-20 md:px-60 mt-10 w-full rounded-sm border-2 border-gray-700"
        />
        <div className="italic text-sm text-center mt-2 mb-4">
          Fig 1. The overview of the entire process
        </div>

        <div className="text-lg mt-10">1. Position of the Sun</div>
        <div className="mt-2">
          The user enters the date and time through the control panel. This
          information, along with the location (latitude and longitude) of the
          city, is used to calculate the sun's position in the sky. The sun's
          position is defined by two angles:
          <ul className="list-disc list-inside mt-2">
            <li>
              <b>Altitude:</b> The angle of the sun above the horizon
            </li>
            <li>
              <b>Azimuth:</b> The direction of the sun along the horizon,
              measured in degrees clockwise from North.
            </li>
          </ul>
          <a
            className="m-4 flex justify-center w-full"
            title="Joshua Cesa, CC BY 3.0 &lt;https://creativecommons.org/licenses/by/3.0&gt;, via Wikimedia Commons"
            href="https://commons.wikimedia.org/wiki/File:Azimut_altitude.svg"
          >
            <img
              className="bg-white rounded-sm p-5 w-80"
              src={azimuthAltitude}
            />
          </a>
          <div className="italic text-sm text-center mt-2 mb-4">
            Fig 2. Altitude and Azimuth of the sun
          </div>
          <div className="mt-4">
            We use the{" "}
            <a
              href="https://github.com/mourner/suncalc"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-yellow-300"
            >
              SunCalc
            </a>{" "}
            library to perform these calculations, which are based on
            astronomical algorithms. To convert this coordinates to a +Y up axis
            system, we use the following formulas:
          </div>
          <div className="p-5 border-2 rounded-sm border-gray-700 m-3">
            <BlockMath
              math={`x = ${radius} \\cdot \\cos(${altitude}) \\cdot \\sin(${azimuth})`}
            />
            <BlockMath math={`y = ${radius} \\cdot \\sin(${altitude})`} />
            <BlockMath
              math={`z = ${radius} \\cdot \\cos(${azimuth}) \\cdot \\cos(${altitude})`}
            />
            <InlineMath math="where," />
            <div className="ml-10 font-mono">
              <InlineMath math={`r`} /> = radius of the sphere
              <br /> <InlineMath math={`\\alpha`} /> = altitude of the sun
              <br /> <InlineMath math={`\\beta`} /> = azimuth of the sun
            </div>
          </div>
        </div>

        <div className="text-lg mt-10 font-bold">
          2. Rooftop Identification and Area Calculation
        </div>
        <div className="mt-2">
          Once a building is selected, the application identifies the rooftop
          surfaces. This is done by analyzing the 3D model's geometry. Each
          surface in the model is defined by a set of triangles. For each
          triangle, we calculate its "normal" – a vector that points
          perpendicular to the surface.
          <br />
          <div className="flex justify-center w-full m-4">
            <img className="rounded-sm w-100" src="/assets/rooftop.png" />
          </div>
          <div className="italic text-sm text-center mt-2 mb-4">
            Fig 3. Identified rooftops in red
          </div>
          <br />
          If the Y component of the normal vector is above a certain threshold
          (meaning the surface is facing upwards), we consider it part of the
          rooftop. The area of each rooftop triangle is then calculated, and
          these areas are summed to get the total rooftop area.
        </div>

        <div className="text-lg mt-10 font-bold">3. Shadow Analysis</div>
        <div className="mt-2">
          Shadows can significantly reduce the amount of sunlight reaching the
          solar panels. To account for this, we perform a shadow analysis. This
          involves casting rays from the rooftop surface towards the sun's
          position. If a ray intersects with another building or object before
          reaching the sun, that point on the rooftop is considered to be in
          shadow.
          <br />
          <div className="m-4">
            <video controls muted className="rounded-sm">
              <source
                src="/assets/shadowAnalysis.mp4"
                type="video/mp4"
              ></source>
            </video>
          </div>
          <br />
          To perform this analysis, we divide each rooftop triangle into a grid
          of sample points. For each sample point, we cast a ray towards the
          sun. A shadow factor of 0 means that the entire rooftop is in full
          sunlight, while a shadow factor of 1 means that the entire rooftop is
          in shadow.
        </div>

        <div className="text-lg mt-10 font-bold">
          4. Solar Irradiance Calculation
        </div>
        <div className="mt-2">
          Solar irradiance is the amount of solar energy that reaches a surface
          per unit area. It is measured in Watts per square meter (W/m²). We
          consider two types of solar irradiance:
          <ul className="list-disc list-inside mt-2">
            <li>
              <b>Global Horizontal Irradiance (GHI):</b> The total amount of
              solar radiation received on a horizontal surface.
            </li>
            <li>
              <b>Direct Normal Irradiance (DNI):</b> The amount of solar
              radiation received directly from the sun on a surface that is
              perpendicular to the sun's rays.
            </li>
          </ul>
          <br />
          <div>
            We use monthly average GHI and DNI data obtained from{" "}
            <a
              href="https://www.solarenergylocal.com/states/new-york/new-york/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-yellow-300"
            >
              Solar Energy Local
            </a>
            . These values are used to estimate the instantaneous GHI and DNI at
            the specified date and time using the formulas:
            <div className="p-5 border-2 rounded-sm border-gray-700 m-3">
              <BlockMath
                math={`GHI_{instant} = (\\frac{GHI_{average} \\cdot \\sin(\\alpha)}{\\sin(\\alpha_{max})} \\cdot \\frac{1000}{24})`}
              />
              <br />
              <BlockMath
                math={`DNI_{instant} = (\\frac{DNI_{average} \\cdot 1000}{24})`}
              />
              <InlineMath math={`where,`} />
              <div className="ml-10 mt-2 font-mono">
                <InlineMath math={`GHI_{average}`} /> = average daily GHI for
                the month
                <br />
                <InlineMath math={`DNI_{average}`} /> = average daily DNI for
                the month
                <br />
                <InlineMath math={`\\alpha`} /> = sun's altitude angle in rad
                <br />
                <InlineMath math={`\\alpha_{max}`} /> = maximum possible solar
                altitude angle
              </div>
            </div>
          </div>
          <br />
          The angle at which sunlight hits the rooftop surface also affects the
          amount of solar energy received. The closer the sunlight is to being
          perpendicular to the surface, the more energy is received. This is
          accounted for by calculating the cosine of the angle between the sun's
          rays and the rooftop surface normal{" "}
          <InlineMath math={`\\cos (\\theta)`} />.
        </div>

        <div className="text-lg mt-10 font-bold">
          5. Power Potential Calculation
        </div>
        <div className="mt-2">
          Finally, we combine all the calculated factors to estimate the power
          potential of the BIPV installation. Effective irradiance is the sum of
          direct and diffuse irradiance. It is calculated as follows:
          <div className="p-5 border-2 rounded-sm border-gray-700 m-3">
            <BlockMath
              math={`Direct = DNI_{instant} * \\cos (\\theta) * (1 - shadowFraction)`}
            />
            <BlockMath math={`Diffuse = GHI_{instant} * 0.2`} />
            <BlockMath
              math={`\\therefore \\medspace \\text{Effective Irradiance} = Direct + Diffuse`}
            />
          </div>
          Note that, diffuse is assumed to be 20% of the instantaneous GHI for
          the calculation.
          <br />
          <br />
          Finally, power is calculated by multiplying effective irradiance,
          area, and the solar panel efficiency.
          <div className="p-5 border-2 rounded-sm border-gray-700 m-3">
            <BlockMath
              math={`Power = \\text{Effective Irradiance} * \\text{Area} * \\text{Panel Efficiency} `}
            ></BlockMath>
          </div>
          The resulting power is expressed in Watts <InlineMath math="(W)" />.
          The application then converts this to Kilowatts{" "}
          <InlineMath math="(kW)" /> for easier readability.
        </div>
      </div>

      <div className="mt-10 mb-10">
        <div className="text-2xl ">Assumptions and Limitations</div>
        <div className="mt-2">
          The SolarBIPV tool estimates solar energy potential with several
          assumptions. Be aware of these limitations:
          <ul className="list-disc list-inside mt-2">
            <li>Uses monthly average solar data; actual irradiance varies.</li>
            <li>
              Simplified 3D model omits small objects affecting shadow accuracy.
            </li>
            <li>Assumes a fixed 20% panel efficiency.</li>
            <li>
              Does not account for panel orientation/tilt; assumes rooftop
              alignment.
            </li>
            <li>Ignores snow/dust impact on panel performance.</li>
            <li>Excludes inverter efficiency.</li>
          </ul>
        </div>
      </div>
      <hr />
    </div>
  );
};
