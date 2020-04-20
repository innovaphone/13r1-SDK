/*---------------------------------------------------------------------------*/
/* network.h                                                                 */
/* copyright (c) innovaphone 2017                                            */
/*                                                                           */
/*---------------------------------------------------------------------------*/

class LocalAddr : public istd::listElement<LocalAddr> {
public:
    bool preferred;
    bool iPv6;
    bool vpn;
    char * addr;
    LocalAddr(char * addr, bool iPv6, bool preferred, bool vpn) { 
        this->addr = addr;
        this->iPv6 = iPv6; 
        this->preferred = preferred;
        this->vpn = vpn;
    };
    ~LocalAddr() { if(addr) free(addr); };
};

class LocalAddresses {
public:
    istd::list <class LocalAddr> localAddresses;

    ~LocalAddresses() {
        while(this->localAddresses.front()) {
            delete this->localAddresses.front();
        }
    }
};

class INetwork {
public:
    static LocalAddresses * GetLocalAddresses();
};