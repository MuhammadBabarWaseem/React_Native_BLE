import useBLE from '@/hooks/useBle';
import React from 'react'
import { Alert, Button, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { Device } from 'react-native-ble-plx';

const FindDevice = () => {
    const { requestPermission, scanForDevices, allDevices, connectToDevice } = useBLE();

    const handleSearch = async () => {
        requestPermission((isGranted: Boolean) => {
            if (isGranted) {
                scanForDevices();
            } else {
                Alert.alert(
                    'Permission Required',
                    'Bluetooth permission is required to scan for devices.',
                    [{ text: 'OK' }]
                );
            }
        })
    }

    const handleConnectToDevice = (device: Device) => {
        connectToDevice(device);
    }

    return (
        <ScrollView style={{ backgroundColor: 'lightblue' }}>
            <View
                style={{ justifyContent: 'center', alignItems: 'center' }}
            >
                <Text style={{ marginBottom: Platform.OS === 'android' ? 20 : 0, fontSize: 20, fontWeight: '700', textAlign: 'center', color: "black" }}>Find Device Screen to find nearby bluetooth devices</Text>

                <Button
                    title="Request Permission"
                    onPress={handleSearch}
                />

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
                    {allDevices?.length > 0 ? (
                        allDevices?.map((device: Device, index: number) => (
                            <TouchableOpacity onPress={() => handleConnectToDevice(device)} key={index} style={{ marginBottom: 10, borderWidth: 1, borderColor: 'Black', padding: 8, marginTop: 10, borderRadius: 20 }}>
                                <Text style={{ color: 'black' }}>{device.name ? device.name : device?.id}</Text>
                                <Text style={{ color: 'black' }}>
                                    {device?.isConnectable ? 'Connectable' : 'Not Connectable'}
                                </Text>
                                <Text style={{ color: 'black' }}>{device?.name ?? 'N/A'}</Text>
                                <Text style={{ color: 'black' }}>{device?.localName ?? 'N/A'}</Text>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text style={{ color: 'black', fontSize: 17 }}>No devices found.</Text>
                    )}
                </View>
            </View>
        </ScrollView>
    )
}

export default FindDevice
