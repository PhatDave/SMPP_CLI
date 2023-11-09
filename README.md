# SMPP_CLI

### A small application used to create SMPP clients or centers. Serves as both the SMSC and ESME.

(Taken from the help page)

---

```
CLI SMPP (Client)

Options

  --help                  Display this usage guide.
  -h, --host string       The host (IP) to connect to.
  -p, --port number       The port to connect to.
  -s, --systemid string   SMPP related login info.
  -w, --password string   SMPP related login info.
  --sessions number       Number of sessions to start, defaults to 1.
  --messagecount number   Number of messages to send; Optional, defaults to 1.
  --window number         Defines the amount of messages that are allowed to be
                          'in flight'. The client no longer waits for a
                          response before sending the next message for up to
                          <window> messages. Defaults to 100.
  --windowsleep number    Defines the amount time (in ms) waited between
                          retrying in the case of full window. Defaults to 100.
  --mps number            Number of messages to send per second
  --source string         Source field of the sent messages.
  --destination string    Destination field of the sent messages.
  --message string        Text content of the sent messages.
  --debug                 Display all traffic to and from the client; Debug
                          mode.
```
---
```
CLI SMPP (Center)

Options

  --help                  Display this usage guide.
  -p, --port number       The port to connect to.
  -s, --systemid string   SMPP related login info.
  -w, --password string   SMPP related login info.
  --dr                    Whether or not to send Delivery Reports.
  --sessions number       Maximum number of client sessions to accept, defaults
                          to 8.
  --messagecount number   Number of messages to send; Optional, defaults to 0.
  --window number         Defines the amount of messages that are allowed to be
                          'in flight'. The client no longer waits for a
                          response before sending the next message for up to
                          <window> messages. Defaults to 100.
  --windowsleep number    Defines the amount time (in ms) waited between
                          retrying in the case of full window. Defaults to 100.
  --mps number            Number of messages to send per second
  --source string         Source field of the sent messages.
  --destination string    Destination field of the sent messages.
  --message string        Text content of the sent messages.
  --debug                 Display all traffic to and from the center; Debug
                          mode.
```						  
---
