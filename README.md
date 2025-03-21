# SolarBIPV
Interactive 3D visualization tool for analyzing solar energy potential across building surfaces, with dynamic shadow modeling and BIPV calculations.

# How does it work?

### Identify top faces of the building
- The tool iterates through all the faces of the building and identifies the faces with the normal vector pointing upwards. These faces are considered as the top faces of the building.
- A threshold is set to consider faces apart from exact horizontal faces as top faces. This allows us to consider buildings that don't have flat rooftops.

### Calculate the area
- The area of each of these identified top faces is calculated. The total area is the sum of all these individual areas.

### Calculate the shadow fraction.
- We lay points on the identified faces of the building in a grid like structure. A ray starting from this point and towards the sun is casted. A point is considered to be in shadow if this ray is obstructed by any other object in the path.
- The shadow fraction is calculated as the ratio of the number of points in shadow to the total number of points.
- The shadow fraction also conssiders intersection with itself. This helps us to consider the shadow casted by the building on itself. It also helps us to compensate for the non-rooftop faces that are considered as top faces.

### BIPV calculations
- Effective irradiance is the sumation of the direct and diffuse irradiance. The direct irradiance is calculated by `DNI * cos(theta) * (1 - shadowFactor)` where theta is the angle between the normal vector of the face and the sun vector. The diffuse irradiance is considered as 20% of the GHI for simplicity.
- The total power is `effectiveIrradiance * area * efficiency`. The efficiency is considered as 0.20.
