import React from 'react';
import './App.css';
import ControlBlock from './control';

const VENDOR_ID = 0x0B05;
const USAGE = 0x01;
const EVENT_USAGE_PAGE = 0xffc1;
const COMMON_USAGE_PAGE = 0xff01;
const filterConfig = { vendorId: VENDOR_ID, usage: USAGE };

const checkDeviceType = (collections) => {
	if (collections.some((c) => (c.usagePage === COMMON_USAGE_PAGE && c.usage === USAGE))) return 'commonDevice';
	else if (collections.some((c) => (c.usagePage === EVENT_USAGE_PAGE && c.usage === USAGE))) return 'eventDevice';

	return null;
}

function App() {
	const [devices, setDevices] = React.useState({});
	const [select, setSelect] = React.useState(null); 

	const createDeviceObj = (devices) => {
	const devicesTemp = devices.reduce((previous, current) => {
		const pid = current.productId;

		if (previous[pid] === undefined) {
			previous[pid] = {
				pid,
				name: current.productName,
				device: null,
				eventDevice: null,
			}
		}

		const type = checkDeviceType(current.collections);

		if (type === 'commonDevice') previous[pid].device = current;
		else if(type === 'eventDevice') previous[pid].eventDevice = current;

		return previous;
	}, {});

		return devicesTemp;
	};

	React.useEffect(() => {
		Promise.resolve()
			.then(() => navigator.hid.getDevices())
			.then((devices) => setDevices(createDeviceObj(devices)))

		return () => {

		};
	}, []);

	const requestDevice = async () => {
		try {
			const { productId } = (await navigator.hid.requestDevice({ filters: [{ ...filterConfig, usagePage: COMMON_USAGE_PAGE }] }))[0];
			const devices = await navigator.hid.getDevices();

			setDevices(createDeviceObj(devices));
			setSelect(productId);
		} catch (error) {
			
		}
	};

	const onSelectDevice = (e) => {
		setSelect(e.target.id);
	}

	return (
	<div className="App">
		<div className='deviceList'>
			<h1>Device List</h1>
			<div className='list'>
			{
				Object.entries(devices).map(([pid, ele]) => {
					return (
						<div
							id={pid}
							key={pid}
							className='deviceCard'
							title={ele.name}
							onClick={onSelectDevice}
						>
							{ele.name}
						</div>
					)
				})
				}
			</div>
			<button onClick={requestDevice}>Request New Device</button>
		</div>
		<span className='line' />
		{ select && <ControlBlock device={devices[select]} /> }
	</div>
	);
}

export default App;
