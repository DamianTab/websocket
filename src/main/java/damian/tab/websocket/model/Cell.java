package damian.tab.websocket.model;

import lombok.Data;

@Data
public class Cell {
    private final short x;
    private final short y;
    private short occupied = 0;
    private String playerNick = "null";
}
