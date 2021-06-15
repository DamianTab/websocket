package damian.tab.websocket.websocket;

import damian.tab.websocket.model.Cell;
import damian.tab.websocket.model.Game;
import damian.tab.websocket.model.Player;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.BinaryWebSocketHandler;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class BinaryWebSocket extends BinaryWebSocketHandler {

    private Map<String, Game> games = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Map<String, String> params = extractClientCredentials(session.getUri().getQuery());
        String roomName = params.get("room");
        String playerNick = params.get("player");

        Game game = games.get(roomName);
        Player player = new Player(playerNick, session);
        if (game == null) {
            game = new Game(player);
            games.put(roomName, game);
            log.info("New game in room: {}", roomName);
        } else {
            game.getPlayers().put(playerNick, player);
        }
        log.info("New player: {} in game: {}", playerNick, roomName);
//        Init Cells position for current session
        broadcastAllCellsToPlayer(session, game.getCells());
//        Init rest players position for currect session
        broadcastAllPlayersToPlayer(session, game.getPlayers());
//        Inform all other sessions about new player
        broadcastPlayerMoveMessage(game, player);
        //todo reconnect poopusczeniu z suspended players
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) {
        Map<String, String> params = extractClientCredentials(session.getUri().getQuery());
        String roomName = params.get("room");
        String playerNick = params.get("player");

        Player messagePlayer = extractPlayerFromMessage(message);
        Game game = games.get(roomName);
//        Totally-threadsafe
        Player player = game.getPlayers().computeIfPresent(playerNick, (key, value) -> {
            value.setX(messagePlayer.getX());
            value.setY(messagePlayer.getY());
            return value;
        });
        broadcastPlayerMoveMessage(game, player);
//        todo jesli gracz obejmuje cell to wtedy przejmuje je i wysyla wiadomosci do wszystkich
    }

    private void broadcastAllPlayersToPlayer(WebSocketSession session, Map<String, Player> players) {
        log.info(String.valueOf(players));
        players.forEach((key, player) -> {
            sendPlayerMoveMessage(session, player);
        });
    }

    private void broadcastPlayerMoveMessage(Game game, Player sendingPlayer) {
        game.getPlayers().forEach((k, player) -> {
            sendPlayerMoveMessage(player.getSession(), sendingPlayer);
        });
    }

    private void sendPlayerMoveMessage(WebSocketSession session, Player sendingPlayer) {
        try {
            byte[] nickBytes = sendingPlayer.getNick().getBytes();
            byte[] arr = ByteBuffer.allocate(8 + nickBytes.length)
                    .put(shortToBytes((short) 1))
                    .put(shortToBytes(sendingPlayer.getX()))
                    .put(shortToBytes(sendingPlayer.getY()))
                    .put(shortToBytes(sendingPlayer.getScore()))
                    .put(nickBytes)
                    .array();
            BinaryMessage message = new BinaryMessage(arr);
            synchronized(session){
                session.sendMessage(message);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void broadcastAllCellsToPlayer(WebSocketSession session, List<Cell> cells) {
        cells.forEach(cell -> sendCellInfoMessage(session, cell));
    }

    private void sendCellInfoMessage(WebSocketSession session, Cell cell) {
        try {
            byte[] arr = ByteBuffer.allocate(8)
                    .put(shortToBytes((short) 2))
                    .put(shortToBytes(cell.getX()))
                    .put(shortToBytes(cell.getY()))
                    .put(shortToBytes(cell.getOccupied()))
                    .array();
            BinaryMessage message = new BinaryMessage(arr);
            synchronized(session){
                session.sendMessage(message);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private byte[] shortToBytes(short number) {
        return ByteBuffer
                .allocate(2)
                .putShort(number)
                .array();
    }

    private Player extractPlayerFromMessage(BinaryMessage message) {
        ByteBuffer payload = message.getPayload().order(ByteOrder.LITTLE_ENDIAN);
        short messageType = payload.getShort(0);
        short x = payload.getShort(2);
        short y = payload.getShort(4);
        short score = payload.getShort(6);
        payload.position(8);
        payload = payload.slice();
        String nick = StandardCharsets.UTF_8.decode(payload).toString();
        log.debug("Message from: '{}'. Type: {}, X: {}, Y: {}, Score (Client state): {}", nick, messageType, x, y, score);
        return new Player(x, y, score, nick, null);
    }

    private Map<String, String> extractClientCredentials(String queryParams) {
        Map<String, String> result = new HashMap<>();
        String[] params = queryParams.split("&");
        for (int i = 0; i < 2; i++) {
            String[] keyValue = params[i].split("=");
            result.put(keyValue[0].trim(), keyValue[1].trim());
        }
        return result;
    }

}
