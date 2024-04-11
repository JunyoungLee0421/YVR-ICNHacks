import React, { useState } from "react";
import { StyleSheet, ScrollView, ActivityIndicator, Button } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useQuery } from "react-query";
import { LineChart } from "react-native-chart-kit";
import { Text, View } from "@/components/Themed";
import {
  Reading,
  ChartDataset,
  PickerComponentProps,
  Location,
} from "@/types/types";
import { getDataByAreaCodeAndDate } from "@/api/data/dataApi";
import { getAreaCode } from "@/api/areaCode/areaCodeApi";
import { Dropdown } from 'react-native-element-dropdown';

type TransformedDataType = {
  label: string;
  value: string;
};

export default function LineChartTab() {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [label, setLabel] = useState([]);
  const [temperatureData, setTemperatureData] = useState<ChartDataset[]>([]);
  const [CO2Data, setCO2Data] = useState<ChartDataset[]>([]);
  const [airflowData, setAirflowData] = useState<ChartDataset[]>([]);

  const { data: areaCodesData, isLoading: isAreaCodesLoading } = useQuery(
    "areaCodes",
    getAreaCode,
    {
      onSuccess: (data) => {
        // if (data?.data.areaCodes.length > 0) {
        //   const firstAreaCode = data.data.areaCodes[0];
        //   setSelectedLocation(firstAreaCode.areaCode);
        //   setSelectedDate(firstAreaCode.dates[0]);
        // }
      },
    }
  );

  const areaCodes = areaCodesData?.data.areaCodes || [];

  //filter data
  const areaData: TransformedDataType[] = [];
  const dateData: TransformedDataType[] = [];
  areaCodes.forEach(item => {
    areaData.push({
      label: item.areaCode,
      value: item.areaCode
    })
  });
  if (areaCodes.length > 0 && areaCodes[0].dates) {
    areaCodes[0].dates.forEach(item => {
      dateData.push({
        label: item,
        value: item
      })
    });
  }

  const { data: chartData, isLoading: isChartDataLoading } = useQuery(
    ["chartData", selectedLocation, selectedDate],
    () => getDataByAreaCodeAndDate(selectedLocation, new Date(selectedDate)),
    {
      enabled: !!selectedLocation && !!selectedDate,
    }
  );


  const fetchData = () => {
    if (selectedLocation && selectedDate) {
      setIsLoading(true);
      try {
        let labels: any = [];
        let temperatureDataset: ChartDataset[] = [];
        let CO2Dataset: ChartDataset[] = [];
        let airflowDataset: ChartDataset[] = [];

        if (chartData?.success) {
          const fetchedData = chartData.data.data;
          labels = fetchedData.map((item: Reading) =>
            (typeof item.timestamp === "string" ? item.timestamp : "")
              .split("T")[1]
              .substring(0, 5)
          );
          const tempTempData = fetchedData.map((item: Reading) => item.temperature);
          const tempCO2Data = fetchedData.map((item: Reading) => item.co2);
          const tempAirflowData = fetchedData.map((item: Reading) => item.air_flow);
          temperatureDataset = [
            {
              data: tempTempData,
              color: () => "blue",
              strokeWidth: 2,
            },
          ];
          CO2Dataset = [
            {
              data: tempCO2Data,
              color: () => "#fe8286",
              strokeWidth: 2,
            },
          ];
          airflowDataset = [
            {
              data: tempAirflowData,
              color: () => "#ffa5f0",
              strokeWidth: 2,
            },
          ];
          setLabel(labels)
          setTemperatureData(temperatureDataset)
          setCO2Data(CO2Dataset)
          setAirflowData(airflowDataset)
        }
      } catch (error) {
        console.error("❓Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }

    }
  };

  if (isLoading) {
    return (
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <ActivityIndicator size="large" color="#5d8bb0" />
      </View>
    );
  }

  // if (temperatureDataset.length === 0) {
  //   return (
  //     <View style={{ alignItems: "center", justifyContent: "center" }}>
  //       <Text>No data found for this location and date</Text>
  //     </View>
  //   );
  // }


  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <View style={styles.dropdownStyles}>
        <Dropdown
          data={areaData}
          value={selectedLocation}
          onChange={(item) => {
            setSelectedLocation(item.value);
          }}
          labelField={"label"}
          valueField={"value"}
          style={styles.dropdownMenu}
        />
        <Dropdown
          data={dateData}
          value={selectedDate}
          onChange={(item) => {
            setSelectedDate(item.value);
          }}
          labelField={"label"}
          valueField={"value"}
          style={styles.dropdownMenu}
        />
      </View>
      <Button title="Fetch Data" onPress={fetchData} />
      {
        temperatureData.length > 0 && CO2Data.length > 0 && airflowData.length > 0 && (
          <ScrollView style={styles.chartContainer}>
            <Text style={styles.header}>Temperature</Text>
            {
              !isLoading && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ paddingHorizontal: 10 }}
                >
                  <LineChart
                    data={{
                      labels: label,
                      datasets: temperatureData,
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
                  />
                </ScrollView>
              )
            }
            <Text style={styles.header}>CO2</Text>
            {
              !isLoading && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ paddingHorizontal: 10 }}
                >
                  <LineChart
                    data={{
                      labels: label,
                      datasets: CO2Data,
                    }}
                    width={2000}
                    height={300}
                    yAxisSuffix="ppm"
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
                  />
                </ScrollView>
              )
            }
            <Text style={styles.header}>Air Flow</Text>
            {
              !isLoading && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ paddingHorizontal: 10 }}
                >
                  <LineChart
                    data={{
                      labels: label,
                      datasets: airflowData,
                    }}
                    width={2000}
                    height={300}
                    yAxisSuffix="L/s"
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
                  />
                </ScrollView>
              )
            }
            <View style={styles.box}></View>
          </ScrollView>
        )}
    </View >
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
  dropdownStyles: {
    flex: 1,
    flexDirection: "row",
    width: "90%",
    backgroundColor: "#FFF",
    marginTop: 40,
    marginBottom: 40,
  },
  dropdownMenu: {
    marginLeft: 10,
    marginRight: 20,
    width: 150
  },
  box: {
    height: 50
  },
  chartContainer: {
    marginTop: 20
  }
});
