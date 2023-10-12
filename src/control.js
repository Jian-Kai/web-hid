import React from "react";
import './App.css';

const bufferToHexString = (buffer) => Array.from(new Uint8Array(buffer)).map((v) => v.toString(16));

const effectID = [
    { id: 0x00, name: 'Static' },
    { id: 0x01, name: 'Breathing' },
    { id: 0x02, name: 'ColorCycle' },
    { id: 0x04, name: 'Reactive' },
    { id: 0xf0, name: 'off' },
];

const brightnessID = [
    { id: 0x00, name: '0%' },
    { id: 0x19, name: '25%' },
    { id: 0x32, name: '50%' },
    { id: 0x4b, name: '75%' },
    { id: 0x64, name: '100%' },
];

const ControlBlock = (props) => {
    const { device } = props;
    const { pid, name, device: commonDevice, eventDevice } = device;

    const [deviceInfo, setDeviceInfo] = React.useState({
        version: null,
        currentProfile: null,
        currentDPI: null,
        effectData: {
            id: 0x00,
            brightness: 0x64,
        }
    });

    const [keyEvent, setKeyEvent] = React.useState('');

    React.useEffect(() => {
        Promise.resolve()
            .then(async () => {
                await commonDevice.open();
                await eventDevice.open();
            })
            .then(() => getDeviceInfo())
            .then(() => {
                eventDevice.addEventListener("inputreport", ({ data }) => {
                    const response = Array.from(new Uint8Array(data.buffer));

                    switch (response[1]) {
                        case 0x01:
                            handleKeyEvent(response);
                            break;
                        case 0x08:
                            handleDeviceInfoEvent(bufferToHexString(data.buffer));
                            break;
                        default:
                            break;
                    }
                    
                })
            })


        return () => {
            commonDevice.close();
            eventDevice.close();
        };
    }, [pid]);
    
    const sendCommand = (cmdID, content) => {
        if (!commonDevice.open) return;

        return new Promise((resolve) => {
            const reporter = ({ target, reportId, data }) => {
                target.removeEventListener("inputreport", reporter);
        
                console.log('------------------return------------------');
                console.log('reportId', reportId);
                console.log('reportId', reportId === sectionKey);
                console.log('response', bufferToHexString(data.buffer))

                resolve(bufferToHexString(data.buffer))
            };
        
            const sectionKey = 0x00;
            const data = new Uint8Array([cmdID, ...content]);

            console.log('-------------------send-------------------');
            console.log('cmdID ->', cmdID);
            console.log('content ->', content);

            commonDevice.addEventListener('inputreport', reporter)
            commonDevice.sendReport(sectionKey, data);
        });
    };

    const getDeviceInfo = async () => {
        const cmdID = 0x12;
        const data = new Uint8Array([0x00, 0x0000]);

        const response = await sendCommand(cmdID, data);
        
        const version = response.slice(4, 8).reverse().join('.');
        const currentProfile = response[10];
        const currentDPI = response[11];

        setDeviceInfo((prev) => ({
            ...prev,
            version,
            currentProfile,
            currentDPI,
        }));
    };

    const setLighting = async(effectID, brightness) => {
        const data = new Uint8Array([0x28, 0x03, 0x00, effectID, brightness, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00]);

        await sendCommand(0x51, data);
    };

    const setEffect = async (e) => {   
        await setLighting(e.target.id, deviceInfo.effectData.brightness)

        setDeviceInfo((prev) => {
            return {
                ...prev,
                effectData: {
                    ...prev.effectData,
                    id: e.target.id
                }
            }
        })
    };

    const setBrightness = async (e) => { 
        await setLighting(deviceInfo.effectData.id, e.target.id)

        setDeviceInfo((prev) => {
            return {
                ...prev,
                effectData: {
                    ...prev.effectData,
                    brightness: e.target.id
                }
            }
        })
    };

    const handleKeyEvent = (eventData) => {
        const key = eventData[4].toString(2).padStart(8, 0);
        
        const keyArr = [];

        if (key[7] === '1') keyArr.push('leftButton');
        if (key[6] === '1') keyArr.push('rightButton');
        if (key[5] === '1') keyArr.push('scrollButton');
        if (key[2] === '1') keyArr.push('dpiButton');
        if (key[1] === '1') keyArr.push('scroll Up');
        if (key[0] === '1') keyArr.push('scroll Down');
        
        setKeyEvent(keyArr.join(' + '));
    };

    const handleDeviceInfoEvent = (eventData) => {
        console.log(eventData)

        switch (eventData[3]) {
            case '0': {
                setDeviceInfo((prev) => {
                    return {
                        ...prev,
                        currentDPI: eventData[4],
                    }
                })
                break;
            }
            case '1': {
                setDeviceInfo((prev) => {
                    return {
                        ...prev,
                        currentProfile: eventData[4],
                    }
                })
                break;
            }
            default: break;
        }


    }
    

    return (
        <div className="controlBlock">
            <div className="block">
                <h1>Device Info</h1>
                {
                    deviceInfo && (
                        <>
                            <div>{`Version： ${deviceInfo.version}`}</div>
                            <div>{`currentProfile： ${deviceInfo.currentProfile}`}</div>
                            <div>{`currentDPI： ${deviceInfo.currentDPI}`}</div>
                        </>
                    )
                }
            </div>
            <div className="block">
                <h1>Lighting Effect</h1>
                <h2>Effect</h2>
                <div className="effectBlock">
                    {
                        effectID.map((e) => {
                            return (
                                <button id={e.id} key={`effect_${e.id}`} onClick={setEffect}>{e.name}</button>
                            )
                        })
                    }
                </div>
                <h2>Brightness</h2>
                <div className="effectBlock">
                    {
                        brightnessID.map((e) => {

                            return (
                                <button id={e.id} key={`brightness_${e.id}`} onClick={setBrightness}>{e.name}</button>
                            )
                        })
                    }
                </div>
            </div>
            <div className="block">
                <h1>Key Event</h1>
                <div>{keyEvent}</div>
            </div>
        </div>
    );
};


export default ControlBlock;