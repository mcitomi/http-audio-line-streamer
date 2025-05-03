export var clientCount = 0;

export function newClient(bool) {
    bool ? clientCount++ : clientCount--;
}
