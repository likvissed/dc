class ServicePort < ActiveRecord::Base

  resourcify

  before_save :filter_ports

  belongs_to :service_network

  strip_attributes allow_empty: true, collapse_spaces: true

  private

  # Фильтр для корректной формы записи данных
  def filter_ports
    self.local_tcp_ports = filter(self.local_tcp_ports) unless self.local_tcp_ports.nil?
    self.local_udp_ports = filter(self.local_udp_ports) unless self.local_udp_ports.nil?
    self.inet_tcp_ports = filter(self.inet_tcp_ports) unless self.inet_tcp_ports.nil?
    self.inet_udp_ports = filter(self.inet_udp_ports) unless self.inet_udp_ports.nil?
  end

  def filter(value)
    value
      .gsub(/[^\d ,-]/, '')               # Разрешаем только цифры, пробел, тире и запятую
      .gsub(/-+/, '-')                    # Множественное повторение тире (оставить одно)
      .gsub(/,+/, ',')                    # Множественное повторение запятой (оставить одну)
      .gsub(/ +/, ' ')                    # Множественное повторение пробелов (оставить один)
      .gsub(/, {0,1}- {0,1},/, ',')       # Только тире (удалить, если без цифр)
      .gsub(/(\d+)[- ]*,/, '\1,')         # Тире или пробелы после цифры и до запятой (удалить)
      .gsub(/(,[- ]*)+(\d+)/, ', \2')     # Тире или пробелы до цифры и после запятой (удалить)
      .gsub(/(\d+) ([^-])/, '\1, \2')     # Поставить запятую, если она отсутствует
      .gsub(/(\d+) {0,1}-[ -]*/, '\1 - ') # Удалить лишний пробел и тире (например: 60 - - - 80)
      .gsub(/(\d+)-(\d+)/, '\1 - \2')     # Добавить пробелы при конструкции 60-80
      .gsub(/(\d+)( - \d+)+/, '\1\2')     # Заменить конструкцию вида 1 - 2 - 3 - 4 на 1 - 4
      .gsub(/^[ ,-]+/, '')                # Начало строки
      .gsub(/[ ,-]+$/, '')                # Конец строки
  end

end
