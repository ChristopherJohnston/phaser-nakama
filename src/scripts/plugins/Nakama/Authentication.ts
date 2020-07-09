import * as NakamaApi from '@heroiclabs/nakama-js';
import { ApiAccount, ApiAccountDevice } from "@heroiclabs/nakama-js/dist/api.gen";
import { NakamaPlugin } from '.';

class Device {
    uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    getDeviceId() {
        let deviceId: string = localStorage.deviceKey;
    
        if (deviceId === undefined) {
            deviceId = this.uuidv4();
            localStorage.deviceKey = deviceId;
        }
    
        console.info('deviceId: ', deviceId);
        return deviceId;

        // 662ddc14-0535-42ee-ba3d-55d8ff8da45e = Christopher
        // d6e3ec3d-d513-4b10-a9cc-d2a19a111c64 = Chris_Johnston
    }
}

class AuthenticationProvider {
    plugin: NakamaPlugin;

    constructor(plugin: NakamaPlugin) {
        this.plugin = plugin;
    }

    async loginSuccessful(linkAccountToDevice=false) {
        localStorage.nakamaAuthToken = this.plugin.session.token;
        
        const session = this.plugin.session;
        console.log(`Successfully Authenticated.`, {
            UserId: session.user_id,
            Username: session.username,
            Expired: session.isexpired(Date.now()/1000),
            ExpiresAt: new Date(session.expires_at*1000).toISOString()
        });

        this.plugin.connectSocket();

        if (linkAccountToDevice) {
            await this.linkAccountToDevice();
        }
    }

    async linkAccountToDevice() {
        const deviceId = new Device().getDeviceId();
        const success = await this.plugin.client.linkDevice(this.plugin.session, { id: deviceId });
        console.info(`Successfully Linked Device Id ${deviceId} to current user`, success);
    }

    async unlinkAccountFromDevice() {
        const deviceId = new Device().getDeviceId();
        const success = await this.plugin.client.unlinkDevice(this.plugin.session, { id: deviceId });
        console.info(`Successfully Unlinked Device Id ${deviceId} from current user`, success);
    }
}

class DeviceAuthentication extends AuthenticationProvider {
    device: Device;

    constructor(plugin: NakamaPlugin) {
        super(plugin);
        this.device = new Device();
    }

    async login(create?: boolean, name?: string) : Promise<boolean> {
        try {
            this.plugin.session = await this.plugin.client.authenticateDevice(
                { id: this.device.getDeviceId(), create: create, username: name}
            );
            this.loginSuccessful();
            return true;
        } catch (error) {
            console.info("exception:", error);
            return false;
        }
    }

    async register(name: string) {
        return this.login(true, name);
    }
}

class EmailAuthentication extends AuthenticationProvider {
    constructor(plugin: NakamaPlugin) {
        super(plugin);
    }

    async login(email: string, password: string, rememberDevice=false, username?: string, create=false) : Promise<boolean> {
        try {
            console.log(`login details: ${email}, ${username}, ${create}`);
            this.plugin.session = await this.plugin.client.authenticateEmail({ email, password, create, username});
            
            this.loginSuccessful();
            if (rememberDevice) {
                this.linkAccountToDevice();
            }
            return true;
        } catch (error) {
            const error_message = await error.json();
            console.warn("Login Error:", error_message);
            throw error_message;
        }
    }

    async register(email: string, password: string, username: string) : Promise<boolean> {        
        try {
            const result = await this.login(email, password, false, username, true);
            console.info('Successfully Registered New User');
            return result
        } catch (error) {
            console.warn("Error Registering New User:", error);
            throw error;
        }
    }
}

class Authentication {
    plugin: NakamaPlugin;
    device: DeviceAuthentication;
    email: EmailAuthentication;

    constructor(plugin: NakamaPlugin) {
        this.plugin = plugin
        this.device = new DeviceAuthentication(this.plugin);
        this.email = new EmailAuthentication(this.plugin);
    }

    async restore() {
        // attempt to restore session
        if (localStorage.nakamaAuthToken) {
            const session = NakamaApi.Session.restore(localStorage.nakamaAuthToken);
            if (session.isexpired(Date.now()/1000)) {
                console.info("session has expired");
            } else {
                this.plugin.session = session;
                this.email.loginSuccessful();
                return true;
            }
        }

        if (localStorage.deviceKey != undefined) {
            console.log("attempting to login with device id")
            return await this.device.login(); 
        }
    }

    async logout(fromAllDevices=false) {
        if (fromAllDevices) {
            const { devices } = await <ApiAccount>this.plugin.client.getAccount(this.plugin.session);

            if (devices) {
                devices!.forEach(async (device: ApiAccountDevice) => {
                    if (localStorage.deviceKey != undefined && device.id != localStorage.deviceKey) {
                        this.plugin.client.unlinkDevice(this.plugin.session, { id: device.id });
                        console.log(`Unlinked device ${device.id}`);
                    }
                });
            }
        }

        this.plugin.appearOffline();

        if (localStorage.deviceKey != undefined) {
            const success = await this.plugin.client.unlinkDevice(this.plugin.session, { id: localStorage.deviceKey });
            console.info("Remove device from account", success)
            localStorage.removeItem('deviceKey');
        }

        localStorage.removeItem('nakamaAuthToken');
        this.plugin.init();
        console.info("logout successful");
    }
}

export { Authentication, DeviceAuthentication, EmailAuthentication };