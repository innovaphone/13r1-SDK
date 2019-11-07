/*---------------------------------------------------------------------------*/
/* ethernet.h                                                                */
/* copyright (c) innovaphone 2016                                            */
/*                                                                           */
/*---------------------------------------------------------------------------*/

#define MAC_ADDRESS_SIZE    6
#define IP_ADDRESS_SIZE    46

class IEthernet {
public:
    static bool GetMACAddress(byte * mac, class IInstanceLog * const log);
    static bool GetIpAddress(char * buffer, size_t bufferLen, bool ipv6, class IInstanceLog * const log);
};
