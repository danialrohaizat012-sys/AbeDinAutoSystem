import { mappedSewaRole } from './role.ts';
import { assertEquals } from 'jsr:@std/assert@1.0.11';
Deno.test('owner remains owner', () => assertEquals(mappedSewaRole('owner'), 'owner'));
Deno.test('downgraded owner becomes staff', () => assertEquals(mappedSewaRole('sales_advisor'), 'staf'));
Deno.test('operations becomes staff', () => assertEquals(mappedSewaRole('operations'), 'staf'));
Deno.test('unknown role never becomes owner', () => assertEquals(mappedSewaRole('invalid'), 'staf'));
