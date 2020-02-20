class AddConsumerFioToServices < ActiveRecord::Migration[5.2]
  def change
    add_column :services, :consumer_fio, :string, after: :name_monitoring, null: false
  end
end
