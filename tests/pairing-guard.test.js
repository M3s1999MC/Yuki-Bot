const test = require('node:test');
const assert = require('node:assert/strict');
const { createPairingGuard } = require('../utils/pairingGuard');

const freshSock = () => ({ authState: { creds: { registered: false } } });
const linkedSock = () => ({ authState: { creds: { registered: true } } });

test('rechaza si el bot aún no tiene socket', () => {
    const guard = createPairingGuard();
    const r = guard.check({ sock: null, phone: '573001234567', ip: '1.1.1.1' });
    assert.equal(r.ok, false);
    assert.equal(r.status, 503);
});

test('rechaza si Yuki ya está vinculada y no gasta intentos', () => {
    const guard = createPairingGuard({ maxPerIp: 1 });
    for (let i = 0; i < 5; i += 1) {
        const r = guard.check({ sock: linkedSock(), phone: '573001234567', ip: '1.1.1.1' });
        assert.equal(r.ok, false);
        assert.equal(r.status, 409);
    }
    // El rechazo por "ya vinculada" no consumió el cupo de la IP
    assert.equal(guard.check({ sock: freshSock(), phone: '573001234567', ip: '1.1.1.1' }).ok, true);
});

test('valida el número: tipo, largo y caracteres', () => {
    const guard = createPairingGuard();
    for (const phone of [undefined, ['573001234567'], '', '12345', 'abcdefghijkl', '1'.repeat(16)]) {
        const r = guard.check({ sock: freshSock(), phone, ip: '2.2.2.2' });
        assert.equal(r.ok, false, `debería rechazar ${JSON.stringify(phone)}`);
        assert.equal(r.status, 400);
    }
});

test('limpia símbolos del número válido', () => {
    const guard = createPairingGuard();
    const r = guard.check({ sock: freshSock(), phone: '+57 (300) 123-4567', ip: '3.3.3.3' });
    assert.deepEqual(r, { ok: true, phone: '573001234567' });
});

test('limita intentos por IP y se libera al pasar la ventana', () => {
    let t = 1_000_000;
    const guard = createPairingGuard({ now: () => t, windowMs: 1000, maxPerIp: 3, maxGlobal: 100 });
    for (let i = 0; i < 3; i += 1) {
        assert.equal(guard.check({ sock: freshSock(), phone: '573001234567', ip: '4.4.4.4' }).ok, true);
    }
    const blocked = guard.check({ sock: freshSock(), phone: '573001234567', ip: '4.4.4.4' });
    assert.equal(blocked.status, 429);
    // Otra IP no se ve afectada
    assert.equal(guard.check({ sock: freshSock(), phone: '573001234567', ip: '5.5.5.5' }).ok, true);
    // Pasada la ventana, la IP vuelve a poder pedir
    t += 1000;
    assert.equal(guard.check({ sock: freshSock(), phone: '573001234567', ip: '4.4.4.4' }).ok, true);
});

test('aplica un tope global aunque cambien las IP', () => {
    const guard = createPairingGuard({ maxPerIp: 100, maxGlobal: 4 });
    for (let i = 0; i < 4; i += 1) {
        assert.equal(guard.check({ sock: freshSock(), phone: '573001234567', ip: `9.9.9.${i}` }).ok, true);
    }
    assert.equal(guard.check({ sock: freshSock(), phone: '573001234567', ip: '9.9.9.200' }).status, 429);
});
