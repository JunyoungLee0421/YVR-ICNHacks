import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { LineChart } from "react-native-chart-kit";
import { Text, View } from "@/components/Themed";
import { Reading } from "@/types/types";
import { getDataByAreaCodeAndDate } from "@/api/data/dataApi";
import { getAreaCode } from "@/api/areaCode/areaCodeApi";

type ChartDataset = {
  data: number[];
  color: () => string;
  strokeWidth: number;
};

interface AreaCode {
  areaCode: string;
  dates: string[];
}

export default function LineChartTab() {
  const [labels, setLabels] = useState<string[]>([]);
  const [datasetNew, setDatasetNew] = useState<ChartDataset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [locationAreaCodes, setLocationAreaCodes] = useState<AreaCode[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [uniqueDates, setUniqueDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    // Function to fetch area codes
    const fetchAreaCode = async () => {
      setIsLoading(true);
      try {
        const response = await getAreaCode();
        if (response.success) {
          // Store the full area code objects
          setLocationAreaCodes(response.data.areaCodes);
          // Set the first area code as the default selected location
          if (response.data.areaCodes.length > 0) {
            setSelectedLocation(response.data.areaCodes[0].areaCode);
            setUniqueDates(response.data.areaCodes[0].dates);
          }
        } else {
          console.error("Error fetching data:", response.message);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Function to fetch data by area code and date
    const fetchDataByAreaCodeAndDate = async () => {
      if (locationAreaCodes && uniqueDates) {
        setIsLoading(true);
        const formattedDate = new Date(selectedDate);
        try {
          const response = await getDataByAreaCodeAndDate(
            selectedLocation,
            formattedDate
          );
          if (response.success) {
            const fetchedData = response.data.data;
            const timeLabels =
              fetchedData && Array.isArray(fetchedData)
                ? fetchedData.map((item: Reading) =>
                    typeof item.timestamp === "string"
                      ? item.timestamp.split("T")[1].substring(0, 5)
                      : ""
                  )
                : [];

            const tempData = fetchedData.map(
              (item: Reading) => item.temperature
            );

            const newDataset = [
              {
                data: tempData,
                color: () => "blue",
                strokeWidth: 2,
              },
            ];

            setLabels(timeLabels);
            setDatasetNew(newDataset);
          }
        } catch (error) {
          console.error("❓Error fetching data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    const timer = setTimeout(() => {
      fetchAreaCode();
    }, 5000);

    const delayForAdditionalData = setTimeout(() => {
      fetchDataByAreaCodeAndDate();
    }, 300);

    return () => {
      clearTimeout(timer);
      clearTimeout(delayForAdditionalData);
    };
  }, [selectedLocation, selectedDate]);

  if (isLoading) {
    return (
      <View
        style={{
          alignItems: "center",
          height: "100%",
        }}
      >
        <View style={{ paddingTop: 80 }}>
          <ActivityIndicator size="large" color="#5d8bb0" />
        </View>
      </View>
    );
  }

  if (datasetNew.length === 0) {
    return (
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Text>No data found for this location and date</Text>
      </View>
    );
  }

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: "80%" }}>
        <Picker
          selectedValue={selectedLocation}
          onValueChange={(itemValue) => {
            setSelectedLocation(itemValue);
            const selectedArea = locationAreaCodes.find(
              (location) => location.areaCode === itemValue
            );
            if (selectedArea && selectedArea.dates.length > 0) {
              setUniqueDates(selectedArea.dates);
              setSelectedDate(selectedArea.dates[0]);
            } else {
              setUniqueDates([]);
              setSelectedDate("");
            }
          }}
          itemStyle={{ fontSize: 18, height: 150 }}
        >
          {locationAreaCodes.map((location) => (
            <Picker.Item
              label={location.areaCode}
              value={location.areaCode}
              key={location.areaCode}
            />
          ))}
        </Picker>
        <Picker
          selectedValue={selectedDate}
          onValueChange={(itemValue) => setSelectedDate(itemValue)}
          itemStyle={{ fontSize: 18, height: 150 }}
        >
          {uniqueDates.map((date) => (
            <Picker.Item label={date} value={date} key={date} />
          ))}
        </Picker>
      </View>
      <Text style={styles.header}>Temperature</Text>
      {!isLoading && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ paddingHorizontal: 10 }}
        >
          {/* <LineChart
            data={{
              labels: labels,
              datasets: datasetNew,
            }}
            width={2000}
            height={300}
            yAxisSuffix="°C"
            yAxisInterval={2}
            // format time on x-axis
            formatXLabel={(value) => {
              // Prepend a default date to the time string
              const datetime = `2000-03-22T${value}`;
              const date = new Date(datetime);
              return `${date.getHours()}:${date
                .getMinutes()
                .toString()
                .padStart(2, "0")}`;
            }}
            chartConfig={{
              backgroundColor: "#fafafa",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(0, 121, 0, ${opacity})`, // Deep sky blue for contrast
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 30,
              },
              propsForDots: {
                r: "2",
                strokeWidth: "4",
                stroke: "#0288d1",
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 12,
            }}
            withShadow={false}
          /> */}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  header: {
    fontSize: 20,
    marginBottom: 10,
  },
});
