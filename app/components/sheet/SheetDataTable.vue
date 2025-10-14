<script setup lang="ts">
import { Minus, Plus } from 'lucide-vue-next';
import type { SheetContentCard } from '~~/common/types/sheet';
import type { EnhancedFile } from '~~/common/types/drive';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { Button } from '~/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';

defineProps<{
  cards: Array<SheetContentCard>;
}>();

const sheetStore = useSheetStore();
const { addCard, removeCard } = sheetStore;

function handleCardAddition(card: SheetContentCard) {
  // Convert the card back to EnhancedFile format for addCard
  const enhancedFile: EnhancedFile = {
    id: card.id,
    name: card.name,
    mimeType: card.mimeType,
    parents: card.parents,
    thumbnailLink: card.thumbnailLink,
    webContentLink: card.webContentLink,
    webViewLink: card.webViewLink,
    imageUrl: card.imageUrl,
    downloadUrl: card.downloadUrl,
    viewUrl: card.viewUrl,
  };

  addCard(enhancedFile);
}
</script>

<template>
  <div class="w-full h-full relative">
    <div class="rounded-md border overflow-hidden h-full">
      <div class="h-full overflow-y-auto">
        <Table>
          <TableHeader class="sticky top-0 z-20 bg-background">
            <TableRow>
              <TableHead class="w-[100px] bg-background border-b">{{ $t('sheet.table.quantity') }}</TableHead>
              <TableHead class="w-[120px] bg-background border-b">{{ $t('sheet.table.image') }}</TableHead>
              <TableHead class="bg-background border-b">{{ $t('sheet.table.name') }}</TableHead>
              <TableHead class="w-[100px] bg-background border-b">{{ $t('sheet.table.actions') }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="!cards || cards.length === 0">
              <TableCell colspan="4" class="h-24 text-center text-muted-foreground">
                {{ $t('sheet.section.empty') }}
              </TableCell>
            </TableRow>
            <TableRow v-for="card in cards" :key="card.id">
              <TableCell class="font-medium w-[100px]">
                {{ card.quantity }}
              </TableCell>
              <TableCell class="w-[120px]">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <div class="w-16 h-16 border rounded overflow-hidden">
                        <img
                          v-if="card.imageUrl"
                          :src="card.imageUrl"
                          :alt="card.name || 'Card image'"
                          class="w-full h-full object-cover"
                          @error="console.log('Image failed to load:', card.imageUrl)"
                        />
                        <div
                          v-else
                          class="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500"
                        >
                          {{ $t('sheet.display.no_image') }}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent v-if="card.imageUrl" side="right" class="p-2">
                      <div class="w-36 h-48 rounded overflow-hidden">
                        <img
                          :src="card.imageUrl"
                          :alt="card.name || 'Card image'"
                          class="w-full h-full object-cover"
                        />
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell>
                <span class="font-medium">{{ card.name || $t('sheet.display.no_name') }}</span>
              </TableCell>
              <TableCell class="w-[100px]">
                <div class="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    class="h-8 w-8 p-0 cursor-pointer"
                    @click="removeCard(card.id)"
                  >
                    <Minus class="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    class="h-8 w-8 p-0 cursor-pointer"
                    @click="handleCardAddition(card)"
                  >
                    <Plus class="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  </div>
</template>
