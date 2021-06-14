package damian.tab.websocket.model;

import lombok.Data;

@Data
class Player {
    private int x;
    private int y;
    private int score;
    private final String nick;
}
