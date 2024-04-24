import React, { useCallback, useEffect } from 'react'
import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';
import { BleManager, Device, ScanMode } from 'react-native-ble-plx';
import { PERMISSIONS, requestMultiple } from 'react-native-permissions';
import DeviceInfo from 'react-native-device-info';

type PermissionCallback = (result: boolean) => void;

const bleManager = new BleManager()

interface BluetoothLowEnergyApi {
    requestPermission: (callback: PermissionCallback) => void;
    scanForDevices: () => void;
    connectToDevice: (device: Device) => void;
    allDevices: Device[];
}

export default function useBLE(): BluetoothLowEnergyApi {
    const [allDevices, setAllDevices] = React.useState<Device[]>([])

    const requestAudioPermission = async () => {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                {
                    title: 'Audio Permission Required',
                    message: 'App needs microphone access to connect to earphones for audio playback. This permission is a standard requirement for audio functionalities on Android.',
                    buttonPositive: 'OK',
                    buttonNegative: 'Cancel',
                }
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                console.log('Audio permission granted');
                // Try connecting to the earphones again
            } else {
                console.log('Audio permission denied');
                // Optionally show an alert informing the user
                Alert.alert(
                    'Permission Denied',
                    'The app needs audio permission to connect to the earphones. You can grant permission from the app settings.',
                    [
                        {
                            text: 'Go to Settings',
                            onPress: () => Linking.openSettings(),
                        },
                        { text: 'Cancel' },
                    ]
                );
            }
        } catch (err) {
            console.error('Error requesting audio permission:', err);
        }
    };



    const requestPermission = async (callback: PermissionCallback) => {
        if (Platform.OS === 'android') {
            const apiLevel = await DeviceInfo.getApiLevelSync();
            if (apiLevel < 31) {
                const grantedStatus = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: 'Location Permission',
                        message: 'This app requires access to your location to scan for bluetooth devices.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                )
                callback(grantedStatus === PermissionsAndroid.RESULTS.GRANTED);
            } else {
                const result = await requestMultiple([
                    PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
                    PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
                    PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
                ])

                const isAllPermissionGranted =
                    result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
                    result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
                    result['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED

                callback(isAllPermissionGranted)
            }

        } else {
            callback(true);
        }
    }

    const isDuplicateDevice = (devices: Device[], nextDevice: Device) =>
        devices.findIndex(device => device.id === nextDevice.id) > -1;

    const scanForDevices = () => {
        console.log('Scanning for devices...')
        bleManager.startDeviceScan(null, { scanMode: ScanMode.Balanced }, (error, device) => {
            console.log({ deviceName: device?.name, id: device?.id })
            if (error && error.errorCode === 102 && error.message === "BluetoothLE is powered off") {
                Alert.alert("Error", "Bluetooth is powered off. Please turn it on to continue.");
                console.log({ ...error })
                return
            }
            // if (device && (device.name === `SOUNDPEATS Air4`)) {
            if (device) {
                // console.info('Found Babar AirBuds:', device.id, device.name);
                setAllDevices((prevState) => {
                    if (!isDuplicateDevice(prevState, device)) {
                        return [...prevState, device]
                    }
                    return prevState;
                })
            }
        })
        setTimeout(() => {
            console.log('Stopping scan after 7 seconds...')
            bleManager.stopDeviceScan()
        }, 7000)
    }

    const connectToDevice = useCallback(async (device: Device) => {
        try {

            if (Platform.OS === 'android') {
                const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
                if (!hasPermission) {
                    await requestAudioPermission();
                    return;
                }
            }

            console.log({ id: device?.id, name: device?.name })
            console.log(`Connecting to device: ${device?.name ?? device?.id}`);
            await bleManager.connectToDevice(device?.id);
            console.log(`Connected to device: ${device?.name ?? device?.id}`);
        } catch (error) {
            console.error(`Error connecting to device: ${device?.name ?? device?.id}`, error);
        }
    }, []);

    useEffect(() => {
        return () => {
            console.log('Stopping scan...')
            bleManager.stopDeviceScan()
        }
    }, [])

    return {
        requestPermission,
        allDevices,
        scanForDevices,
        connectToDevice
    }
}
