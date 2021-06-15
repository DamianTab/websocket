package damian.tab.websocket.websocket;

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
        if (game == null) {
            game = new Game(new Player(playerNick, session));
            games.put(roomName, game);
            log.info("New game in room: {}", roomName);
        } else {
            game.getPlayers().put(playerNick, new Player(playerNick, session));
        }
        log.info("New player: {} in game: {}", playerNick, roomName);
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

    private void broadcastPlayerMoveMessage(Game game, Player player) {
        game.getPlayers().forEach((k, value) -> {
            if (!value.getNick().equals(player.getNick())) {
                try {
                    value.getSession().sendMessage(new BinaryMessage("hello world".getBytes()));
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        });
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
        log.info("Message from: '{}'. Type: {}, X: {}, Y: {}, Score (Client state): {}", nick, messageType, x, y, score);
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
