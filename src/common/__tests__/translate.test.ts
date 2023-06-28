import { describe, expect, it } from 'vitest'
import { QuoteProcessor } from '../translate'

describe('QuoteProcessor', () => {
    it('should return the string without quote', () => {
        const quoteProcessor = new QuoteProcessor()
        const deltas = [
            ...quoteProcessor.quoteStart.split(''),
            'T',
            'h',
            'i',
            's',
            ' ',
            'i',
            's',
            ' ',
            'a',
            ' ',
            't',
            'e',
            's',
            't',
            '.',
            ...quoteProcessor.quoteEnd.split(''),
        ]

        let targetText = ''
        for (const delta of deltas) {
            targetText += quoteProcessor.processText(delta)
        }

        expect(targetText).toEqual('This is a test.')
    })

    it('should return the string without quote', () => {
        const quoteProcessor = new QuoteProcessor()
        const deltas = [
            ...quoteProcessor.quoteStart.split(''),
            'T',
            'h',
            'i',
            's',
            ' ',
            'i',
            's',
            ' ',
            'a',
            ' ',
            't',
            'e',
            's',
            't',
            '.',
            '(',
            ')' + quoteProcessor.quoteEnd.split('')[0],
            ...quoteProcessor.quoteEnd.split('').slice(1),
        ]

        let targetText = ''
        for (const delta of deltas) {
            targetText += quoteProcessor.processText(delta)
        }

        expect(targetText).toEqual('This is a test.()')
    })

    it('should return the string without quote', () => {
        const quoteProcessor = new QuoteProcessor()
        const text = 'This is a test.'
        const targetText = quoteProcessor.processText(quoteProcessor.quoteStart + text + quoteProcessor.quoteEnd)
        expect(targetText).toEqual(text)
    })

    it('should return the string without quote', () => {
        const quoteProcessor = new QuoteProcessor()
        const text = 'This is a test.'
        const targetText = quoteProcessor.processText(
            `${quoteProcessor.quoteStart}This${quoteProcessor.quoteStart} is ${quoteProcessor.quoteEnd}a${quoteProcessor.quoteStart} test.${quoteProcessor.quoteEnd}`
        )
        expect(targetText).toEqual(text)
    })

    it('should return the same string if no quote exists', () => {
        const quoteProcessor = new QuoteProcessor()
        const deltas = [
            '<X',
            '1',
            '2',
            'Y>',
            'T',
            'h',
            'i',
            's',
            ' ',
            'i',
            's',
            ' ',
            'a',
            ' ',
            't',
            'e',
            's',
            't',
            '.',
            '</',
            'X',
            '1',
            '2',
            'Y>',
        ]
        let targetText = ''
        for (const delta of deltas) {
            targetText += quoteProcessor.processText(delta)
        }

        expect(targetText).toEqual('<X12Y>This is a test.</X12Y>')
    })

    it('should return the same string if no quote exists', () => {
        const quoteProcessor = new QuoteProcessor()
        const text = '<X12Y>This is a test.</X12Y>'
        const targetText = quoteProcessor.processText(text)
        expect(targetText).toEqual(text)
    })

    it('should return the same string if no quote exists', () => {
        const quoteProcessor = new QuoteProcessor()
        const text = `This is${quoteProcessor.quoteStart.slice(0, quoteProcessor.quoteStart.length - 1)} a test.`
        const targetText = quoteProcessor.processText(text)
        expect(targetText).toEqual(text)
    })

    it('do not remove the sub part of quote', () => {
        const quoteProcessor = new QuoteProcessor()
        const text = `This is${quoteProcessor.quoteStart.slice(0, quoteProcessor.quoteStart.length - 1)} a test.`
        const targetText = quoteProcessor.processText(quoteProcessor.quoteStart + text + quoteProcessor.quoteEnd)
        expect(targetText).toEqual(text)
    })

    it('do not remove the sub part of quote', () => {
        const quoteProcessor = new QuoteProcessor()
        const text = `This is${quoteProcessor.quoteEnd.slice(0, quoteProcessor.quoteEnd.length - 1)} a test.`
        const targetText = quoteProcessor.processText(quoteProcessor.quoteStart + text + quoteProcessor.quoteEnd)
        expect(targetText).toEqual(text)
    })

    it('do not remove the sub part of quote', () => {
        const quoteProcessor = new QuoteProcessor()
        const text = `This is${quoteProcessor.quoteStart.slice(
            0,
            quoteProcessor.quoteStart.length - 1
        )} a${quoteProcessor.quoteStart.slice(
            0,
            quoteProcessor.quoteStart.length - 2
        )} te${quoteProcessor.quoteEnd.slice(0, quoteProcessor.quoteEnd.length - 1)}st${quoteProcessor.quoteEnd.slice(
            0,
            quoteProcessor.quoteEnd.length - 2
        )}.`
        const targetText = quoteProcessor.processText(quoteProcessor.quoteStart + text + quoteProcessor.quoteEnd)
        expect(targetText).toEqual(text)
    })
})
